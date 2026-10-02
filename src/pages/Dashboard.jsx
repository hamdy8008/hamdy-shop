import { useEffect, useState } from "react";
import { NavLink, useParams, Link } from "react-router-dom";
import { Button, Form, Table, Modal, Row, Col, Alert } from "react-bootstrap";
import { api, money, readStorage } from "../api";
import { Icon, Stats, Loading, ErrorBox, Pages } from "../components/Common";

export default function Dashboard() {
  const { resource } = useParams();
  const valid = ["products", "users", "carts"].includes(resource);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);
  const [changes, setChanges] = useState(() =>
    readStorage("hamdyshop-changes", { products: [], users: [], carts: [] }),
  );
  const [modal, setModal] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [cartProducts, setCartProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [details, setDetails] = useState(null);

  useEffect(() => {
    api("/products/categories")
      .then(setCategories)
      .catch(() => {});
  }, []);
  useEffect(() => {
    setPage(1);
    setSearch("");
    setUserId("");
    setModal("");
    setDetails(null);
    setError("");
    setMessage("");
  }, [resource]);
  useEffect(() => {
    localStorage.setItem("hamdyshop-changes", JSON.stringify(changes));
  }, [changes]);
  useEffect(() => {
    if (!valid) return;
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        let path = "/" + resource + "?limit=8&skip=" + (page - 1) * 8;
        if (search && resource !== "carts")
          path =
            "/" +
            resource +
            "/search?q=" +
            encodeURIComponent(search) +
            "&limit=8&skip=" +
            (page - 1) * 8;
        if (resource === "carts" && userId)
          path = "/carts/user/" + userId + "?limit=8&skip=" + (page - 1) * 8;
        const data = await api(path);
        let list = data[resource];
        // DummyJSON writes are simulated, so show our saved changes on top.
        const saved = changes[resource];
        list = list
          .filter(
            (item) =>
              !saved.some((change) => change.id === item.id && change.deleted),
          )
          .map((item) => saved.find((change) => change.id === item.id) || item);
        if (page === 1) {
          const added = saved.filter(
            (item) =>
              item.isLocal &&
              !item.deleted &&
              (!userId || item.userId === Number(userId)) &&
              (!search ||
                JSON.stringify(item)
                  .toLowerCase()
                  .includes(search.toLowerCase())),
          );
          list = [...added, ...list];
        }
        if (resource === "carts" && search)
          list = list.filter(
            (item) =>
              String(item.id).includes(search) ||
              String(item.userId).includes(search),
          );
        if (active) {
          setRows(list);
          setTotal(data.total ?? data.carts?.length ?? 0);
        }
      } catch (error) {
        if (active) setError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [resource, page, search, userId, reload, changes]);

  function remember(item) {
    setChanges((current) => ({
      ...current,
      [resource]: [
        item,
        ...current[resource].filter((row) => row.id !== item.id),
      ],
    }));
  }
  function openForm(item) {
    setSelected(item);
    setFormError("");
    setModal(item ? "edit" : "add");
    if (resource === "products")
      setForm({
        title: item?.title || "",
        sku: item?.sku || "",
        category: item?.category || categories[0]?.slug || "",
        price: item?.price || 0,
        stock: item?.stock || 0,
        description: item?.description || "",
        thumbnail: item?.thumbnail || "",
      });
    if (resource === "users")
      setForm({
        firstName: item?.firstName || "",
        lastName: item?.lastName || "",
        username: item?.username || "",
        email: item?.email || "",
        role: item?.role || "user",
        image: item?.image || "",
      });
    if (resource === "carts") {
      setForm({ userId: item?.userId || 1 });
      setCartProducts(
        item
          ? item.products.map((product) => ({
              id: product.id,
              quantity: product.quantity,
            }))
          : [{ id: 1, quantity: 1 }],
      );
    }
  }
  async function view(item) {
    setError("");
    try {
      setDetails(
        item.isLocal
          ? item
          : { ...(await api("/" + resource + "/" + item.id)), ...item },
      );
    } catch (error) {
      setError(error.message);
    }
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      let body = { ...form };
      if (resource === "products")
        body = {
          ...body,
          price: Number(body.price),
          stock: Number(body.stock),
        };
      if (resource === "carts")
        body = {
          userId: Number(form.userId),
          products: cartProducts.map((item) => ({
            id: Number(item.id),
            quantity: Number(item.quantity),
          })),
          merge: false,
        };
      // Locally added rows have no real server ID: re-submit them to /add.
      const local = selected?.isLocal;
      const result = await api(
        "/" + resource + (selected && !local ? "/" + selected.id : "/add"),
        selected && !local ? "PUT" : "POST",
        body,
      );
      remember({
        ...selected,
        ...result,
        ...body,
        ...(resource === "carts" ? { products: result.products } : {}),
        id: selected?.id || Date.now(),
        isLocal: !selected || local,
        deleted: false,
      });
      setModal("");
      setMessage(
        (selected ? "Changes saved" : "Item added") +
          ". Kept locally because this is a demo API.",
      );
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setFormError("");
    try {
      if (!selected.isLocal)
        await api("/" + resource + "/" + selected.id, "DELETE");
      remember({ ...selected, deleted: true });
      setModal("");
      setMessage("Item deleted.");
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  }
  function exportCsv() {
    const keys =
      resource === "products"
        ? ["id", "title", "category", "price", "stock"]
        : resource === "users"
          ? ["id", "firstName", "lastName", "email", "role"]
          : ["id", "userId", "totalProducts", "totalQuantity", "total"];
    const csv = [
      keys.join(","),
      ...rows.map((item) =>
        keys
          .map(
            (key) => '"' + String(item[key] ?? "").replaceAll('"', '""') + '"',
          )
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = resource + ".csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  const title =
    resource === "products"
      ? "Product Inventory"
      : resource === "users"
        ? "User Directory"
        : "Cart Management";
  const description =
    resource === "products"
      ? "Manage your catalog, stock levels, and pricing."
      : resource === "users"
        ? "Manage your customers and their account details."
        : "Oversee and monitor all customer shopping activity.";
  if (!valid)
    return (
      <main className="shop-main">
        <h1>Unknown dashboard page</h1>
        <Link to="/admin/products">Open Inventory</Link>
      </main>
    );

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" to="/products">
          hamdyshop
        </Link>
        <p className="muted label">Admin Panel</p>
        <nav>
          {[
            ["products", "archive", "Inventory"],
            ["carts", "bag", "Orders"],
            ["users", "people", "Customers"],
          ].map(([key, icon, label]) => (
            <NavLink key={key} to={"/admin/" + key}>
              <Icon name={icon} /> {label}
            </NavLink>
          ))}
          <NavLink to="/login">
            <Icon name="person-circle" /> Authentication
          </NavLink>
        </nav>
        <Link className="back-to-shop" to="/products">
          ← Back to shop
        </Link>
      </aside>
      <main className="admin-main">
        <div className="admin-heading">
          <div>
            <h1>{title}</h1>
            <p className="muted mb-0">{description}</p>
          </div>
          <Button
            className={resource === "products" ? "mint-button" : ""}
            onClick={() => openForm(null)}
          >
            <Icon name="plus-lg" /> Add New{" "}
            {resource === "products"
              ? "Product"
              : resource === "users"
                ? "User"
                : "Cart"}
          </Button>
        </div>
        {resource !== "products" && (
          <Stats
            items={
              resource === "users"
                ? [
                    { label: "Total Users", value: total, icon: "people" },
                    {
                      label: "Admins on Page",
                      value: rows.filter((item) => item.role === "admin")
                        .length,
                      icon: "shield-check",
                    },
                    {
                      label: "Customers on Page",
                      value: rows.filter((item) => item.role !== "admin")
                        .length,
                      icon: "person",
                    },
                    {
                      label: "Shown Users",
                      value: rows.length,
                      icon: "person-plus",
                    },
                  ]
                : [
                    { label: "Total Carts", value: total, icon: "cart3" },
                    {
                      label: "Page Cart Value",
                      value: money(
                        rows.reduce((sum, item) => sum + item.total, 0),
                      ),
                      icon: "cash",
                    },
                    {
                      label: "Page Items",
                      value: rows.reduce(
                        (sum, item) => sum + item.totalQuantity,
                        0,
                      ),
                      icon: "bag",
                    },
                    { label: "Shown Carts", value: rows.length, icon: "list" },
                  ]
            }
          />
        )}
        <div className="panel admin-tools">
          <div className="search-field">
            <Icon name="search" />
            <Form.Control
              aria-label={"Search " + resource}
              placeholder={
                resource === "carts"
                  ? "Search this page by cart or user ID..."
                  : "Search " + resource + "..."
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {resource === "carts" && (
            <Form.Control
              className="user-filter"
              aria-label="Filter carts by user ID"
              type="number"
              min="1"
              placeholder="Filter by user ID"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
            />
          )}
          <Button variant="outline-secondary" onClick={exportCsv}>
            <Icon name="download" /> Export CSV
          </Button>
        </div>
        <ErrorBox error={error} retry={() => setReload(reload + 1)} />
        {message && (
          <Alert variant="success" dismissible onClose={() => setMessage("")}>
            {message}
          </Alert>
        )}
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="table-panel">
              <Table responsive className="admin-table mb-0">
                <thead>
                  <tr>
                    {(resource === "products"
                      ? [
                          "Product",
                          "Category",
                          "Price",
                          "Stock Status",
                          "Actions",
                        ]
                      : resource === "users"
                        ? ["User", "Email Address", "Role", "Status", "Actions"]
                        : [
                            "Cart ID",
                            "User",
                            "Total Items",
                            "Total Price",
                            "Actions",
                          ]
                    ).map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      {resource === "products" ? (
                        <>
                          <td>
                            <button
                              className="table-identity"
                              onClick={() => view(item)}
                            >
                              {item.thumbnail && (
                                <img src={item.thumbnail} alt="" />
                              )}
                              <span>
                                <strong>{item.title}</strong>
                                <small>SKU: {item.sku || "—"}</small>
                              </span>
                            </button>
                          </td>
                          <td>
                            <span className="pill">{item.category}</span>
                          </td>
                          <td className="table-price">{money(item.price)}</td>
                          <td>
                            <span
                              className={
                                item.stock > 5
                                  ? "text-success"
                                  : item.stock
                                    ? "text-danger"
                                    : "muted"
                              }
                            >
                              ●
                            </span>{" "}
                            {item.stock
                              ? item.stock <= 5
                                ? "Only " + item.stock + " Left"
                                : item.stock + " In Stock"
                              : "Out of Stock"}
                          </td>
                        </>
                      ) : resource === "users" ? (
                        <>
                          <td>
                            <button
                              className="table-identity"
                              onClick={() => view(item)}
                            >
                              {item.image ? (
                                <img
                                  className="avatar"
                                  src={item.image}
                                  alt=""
                                />
                              ) : (
                                <span className="initials">
                                  {item.firstName[0]}
                                </span>
                              )}
                              <span>
                                <strong>
                                  {item.firstName} {item.lastName}
                                </strong>
                                <small>@{item.username}</small>
                              </span>
                            </button>
                          </td>
                          <td>{item.email}</td>
                          <td>
                            <span className="pill">{item.role}</span>
                          </td>
                          <td>
                            <span className="text-success">●</span> Active
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <Button variant="link" onClick={() => view(item)}>
                              #CRT-
                              {item.isLocal
                                ? String(item.id).slice(-6)
                                : item.id}
                            </Button>
                          </td>
                          <td>User #{item.userId}</td>
                          <td>{item.totalQuantity} items</td>
                          <td className="table-price">{money(item.total)}</td>
                        </>
                      )}
                      <td className="actions">
                        <Button
                          variant="link"
                          aria-label="View details"
                          onClick={() => view(item)}
                        >
                          <Icon name="eye" />
                        </Button>
                        <Button
                          variant="link"
                          aria-label="Edit item"
                          onClick={() => openForm(item)}
                        >
                          <Icon name="pencil" />
                        </Button>
                        <Button
                          variant="link"
                          className="text-danger"
                          aria-label="Delete item"
                          onClick={() => {
                            setSelected(item);
                            setModal("delete");
                            setFormError("");
                          }}
                        >
                          <Icon name="trash" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {!rows.length && (
                <div className="empty">No {resource} found.</div>
              )}
              <Pages page={page} total={total} size={8} setPage={setPage} />
            </div>
          </>
        )}
        <Modal
          show={modal === "add" || modal === "edit"}
          onHide={() => !busy && setModal("")}
          centered
          size={resource === "products" ? "lg" : undefined}
          scrollable
        >
          <Form onSubmit={save}>
            <Modal.Header closeButton>
              <Modal.Title>
                {modal === "edit" ? "Edit" : "Add New"}{" "}
                {resource === "products"
                  ? "Product"
                  : resource === "users"
                    ? "User"
                    : "Cart"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <ErrorBox error={formError} />
              {resource === "products" && selected?.thumbnail && (
                <img
                  className="edit-product-image"
                  src={selected.thumbnail}
                  alt={selected.title}
                />
              )}
              <Row className="g-3">
                {Object.keys(form).map((key) => (
                  <Col
                    md={
                      key === "description" ||
                      key === "email" ||
                      key === "thumbnail" ||
                      key === "image"
                        ? 12
                        : 6
                    }
                    key={key}
                  >
                    <Form.Label htmlFor={"edit-" + key}>
                      {{
                        title: "Product Name",
                        sku: "SKU",
                        userId: "User ID",
                        firstName: "First Name",
                        lastName: "Last Name",
                        thumbnail: "Product Image URL",
                        image: "Profile Image URL",
                        stock: "Stock Quantity",
                        price: "Price ($)",
                      }[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                    </Form.Label>
                    {key === "category" || key === "role" ? (
                      <Form.Select
                        id={"edit-" + key}
                        value={form[key]}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                      >
                        {(key === "category"
                          ? categories.map((item) => ({
                              value: item.slug,
                              label: item.name,
                            }))
                          : [
                              { value: "user", label: "Customer" },
                              { value: "admin", label: "Admin" },
                              { value: "moderator", label: "Moderator" },
                            ]
                        ).map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </Form.Select>
                    ) : (
                      <Form.Control
                        id={"edit-" + key}
                        as={key === "description" ? "textarea" : "input"}
                        rows={key === "description" ? 3 : undefined}
                        type={
                          ["price", "stock", "userId"].includes(key)
                            ? "number"
                            : key === "email"
                              ? "email"
                              : key === "thumbnail" || key === "image"
                                ? "url"
                                : "text"
                        }
                        min={key === "userId" ? 1 : 0}
                        step={key === "price" ? "0.01" : "1"}
                        required={
                          ![
                            "description",
                            "thumbnail",
                            "image",
                            "sku",
                          ].includes(key)
                        }
                        value={form[key]}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                      />
                    )}
                  </Col>
                ))}
              </Row>
              {resource === "carts" && (
                <div className="mt-4">
                  <h3 className="h6">Cart Products</h3>
                  <p className="muted small">
                    Enter product IDs from the catalog. Quantities must be at
                    least 1.
                  </p>
                  {cartProducts.map((item, index) => (
                    <div className="cart-editor-row" key={index}>
                      <Form.Control
                        aria-label={"Product ID " + (index + 1)}
                        type="number"
                        min="1"
                        required
                        value={item.id}
                        onChange={(e) =>
                          setCartProducts(
                            cartProducts.map((row, i) =>
                              i === index
                                ? { ...row, id: e.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                      <Form.Control
                        aria-label={"Quantity " + (index + 1)}
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          setCartProducts(
                            cartProducts.map((row, i) =>
                              i === index
                                ? { ...row, quantity: e.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                      <Button
                        variant="outline-danger"
                        disabled={cartProducts.length === 1}
                        onClick={() =>
                          setCartProducts(
                            cartProducts.filter((row, i) => i !== index),
                          )
                        }
                      >
                        <Icon name="trash" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline-primary"
                    onClick={() =>
                      setCartProducts([...cartProducts, { id: 1, quantity: 1 }])
                    }
                  >
                    Add another product
                  </Button>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline-secondary"
                disabled={busy}
                onClick={() => setModal("")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save Changes"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
        <Modal
          show={modal === "delete"}
          onHide={() => !busy && setModal("")}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete this item?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ErrorBox error={formError} />
            <p>
              This removes the item from your local demo. You can cancel to keep
              it.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              disabled={busy}
              onClick={() => setModal("")}
            >
              Cancel
            </Button>
            <Button variant="danger" disabled={busy} onClick={remove}>
              {busy ? "Deleting..." : "Delete"}
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={!!details}
          onHide={() => setDetails(null)}
          centered
          size="lg"
          scrollable
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {resource === "products"
                ? details?.title
                : resource === "users"
                  ? details?.firstName + " " + details?.lastName
                  : "Cart #" + details?.id}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {details &&
              (resource === "carts" ? (
                <>
                  <p>User #{details.userId}</p>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.products.map((item, index) => (
                        <tr key={index}>
                          <td>{item.title || "Product #" + item.id}</td>
                          <td>{item.quantity}</td>
                          <td>
                            {money(item.total ?? item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <h3 className="h5">Total: {money(details.total)}</h3>
                </>
              ) : resource === "products" ? (
                <>
                  <img
                    className="edit-product-image"
                    src={details.thumbnail}
                    alt={details.title}
                  />
                  <p>{details.description}</p>
                  <p>
                    Price: {money(details.price)} · Stock: {details.stock}
                  </p>
                  <p>Product ID: {details.id}</p>
                  <p>Category: {details.category}</p>
                </>
              ) : (
                <>
                  <img
                    className="profile-detail-avatar"
                    src={details.image}
                    alt=""
                  />
                  <p>Email: {details.email}</p>
                  <p>Username: {details.username}</p>
                  <p>Role: {details.role}</p>
                  <p>User ID: {details.id}</p>
                  <p>Phone: {details.phone || "Not supplied"}</p>
                </>
              ))}
          </Modal.Body>
        </Modal>
      </main>
    </div>
  );
}
