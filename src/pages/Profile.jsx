import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Modal, Form, Alert } from "react-bootstrap";
import { api, money, readStorage } from "../api";
import { Icon, Stats, Loading, ErrorBox } from "../components/Common";

export default function Profile({ user, setUser, logout, authLoading }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("profile");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!user) return;
    api("/carts/user/" + user.id)
      .then((data) =>
        setOrders([
          ...readStorage("hamdyshop-orders", []).filter(
            (item) => item.userId === user.id,
          ),
          ...data.carts,
        ]),
      )
      .catch((error) => setError(error.message));
  }, [user?.id]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/users/" + user.id, "PUT", form);
      setUser({ ...user, ...form });
      setShow(false);
      setMessage("Profile updated for this session.");
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (authLoading) return <Loading />;
  if (!user)
    return (
      <main className="shop-main empty">
        <h1>Sign in to your account</h1>
        <Button as={Link} to="/login">
          Sign in
        </Button>
      </main>
    );
  return (
    <main className="shop-main profile-layout">
      <aside className="account-sidebar">
        <h6 className="price">Account</h6>
        <p className="muted">Manage your settings</p>
        <hr />
        {[
          ["profile", "person-fill", "My Profile"],
          ["orders", "clock-history", "Order History"],
          ["settings", "gear", "Account Settings"],
        ].map(([id, icon, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            <Icon name={icon} /> {label}
          </button>
        ))}
        <hr />
        <button className="text-danger" onClick={logout}>
          <Icon name="box-arrow-right" /> Sign Out
        </button>
      </aside>
      <section>
        <ErrorBox error={error} />
        {message && (
          <Alert variant="success" dismissible onClose={() => setMessage("")}>
            {message}
          </Alert>
        )}
        {tab !== "orders" && (
          <>
            <section className="panel profile-banner">
              <img src={user.image} alt={user.firstName} />
              <div className="flex-grow-1">
                <h1>
                  {user.firstName} {user.lastName}
                </h1>
                <p className="muted">{user.email}</p>
                <span className="pill mint">hamdyshop Member</span>
                <span className="pill ms-2">{user.role || "Customer"}</span>
              </div>
              <Button
                onClick={() => {
                  setForm({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    username: user.username,
                  });
                  setShow(true);
                }}
              >
                Edit Profile
              </Button>
            </section>
            <Stats
              items={[
                {
                  label: "Total Carts & Orders",
                  value: orders.length,
                  icon: "bag",
                },
                {
                  label: "Cart Value",
                  value: money(
                    orders.reduce((sum, item) => sum + (item.total || 0), 0),
                  ),
                  icon: "wallet2",
                },
                { label: "Username", value: user.username, icon: "person" },
              ]}
            />
            {tab === "settings" && (
              <section className="panel mb-4">
                <h2 className="h4">Account Settings</h2>
                <p>Email: {user.email}</p>
                <p>Manage your personal details using Edit Profile.</p>
                <Button variant="outline-danger" onClick={logout}>
                  Sign Out
                </Button>
              </section>
            )}
          </>
        )}
        <section className="panel">
          <h2 className="h4">
            {tab === "orders" ? "Order History" : "Recent Carts & Orders"}
          </h2>
          {orders.length === 0 && (
            <p className="muted">No carts or orders yet.</p>
          )}
          {orders.map((order, index) => (
            <div
              className="order-row"
              key={order.localId || order.id + "-" + index}
            >
              <div>
                <strong>#{order.localId || order.id}</strong>
                <p className="muted mb-0">
                  {order.products.length} products{" "}
                  {order.date &&
                    " · " + new Date(order.date).toLocaleDateString()}
                </p>
              </div>
              <strong className="price">{money(order.total)}</strong>
              <span className="pill mint">
                {order.localId ? "Demo order placed" : "Saved cart"}
              </span>
            </div>
          ))}
        </section>
      </section>
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Form onSubmit={save}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Profile</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {Object.keys(form).map((key) => (
              <div className="mb-3" key={key}>
                <Form.Label htmlFor={"profile-" + key}>
                  {key.replace("Name", " name")}
                </Form.Label>
                <Form.Control
                  id={"profile-" + key}
                  type={key === "email" ? "email" : "text"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required
                />
              </div>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-primary" onClick={() => setShow(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save Changes"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </main>
  );
}
