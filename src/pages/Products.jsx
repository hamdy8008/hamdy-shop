import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Row, Col, Card, Form, Button } from "react-bootstrap";
import { api, money } from "../api";
import { Icon, Loading, ErrorBox, Pages } from "../components/Common";

export default function Products({ addToCart, categoriesOnly }) {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const query = params.get("q") || "";
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("title-asc");
  const [price, setPrice] = useState(2000);
  const [rating, setRating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    api("/products/categories")
      .then(setCategories)
      .catch((error) => setError(error.message));
  }, []);
  useEffect(() => {
    setPage(1);
  }, [query, category, sort, price, rating]);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [sortBy, order] = sort.split("-");
        let path = query
          ? "/products/search?q=" + encodeURIComponent(query) + "&"
          : category
            ? "/products/category/" + encodeURIComponent(category) + "?"
            : "/products?";
        // Combined filters need all matching rows before pagination.
        const localFilter = (query && category) || price < 2000 || rating;
        path +=
          "limit=" +
          (localFilter ? 0 : 12) +
          "&skip=" +
          (localFilter ? 0 : (page - 1) * 12) +
          "&sortBy=" +
          sortBy +
          "&order=" +
          order;
        const data = await api(path);
        let rows = data.products;
        let count = data.total;
        if (localFilter) {
          rows = rows.filter(
            (product) =>
              (!category || product.category === category) &&
              product.price <= price &&
              (!rating || product.rating >= 4),
          );
          count = rows.length;
          rows = rows.slice((page - 1) * 12, page * 12);
        }
        if (active) {
          setProducts(rows);
          setTotal(count);
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
  }, [query, category, page, sort, price, rating, reload]);

  function changeCategory(value) {
    setPage(1);
    setParams({
      ...(query ? { q: query } : {}),
      ...(value ? { category: value } : {}),
    });
  }
  if (categoriesOnly)
    return (
      <main className="shop-main">
        <h1>Shop by Category</h1>
        <p className="muted mb-5">Find something for every part of your day.</p>
        <ErrorBox error={error} />
        <Row className="g-4">
          {categories.map((item) => (
            <Col md={4} sm={6} key={item.slug}>
              <Card
                as={Link}
                to={"/products?category=" + item.slug}
                className="category-card"
              >
                <Icon name="grid" />
                <h3>{item.name}</h3>
                <span>Explore products →</span>
              </Card>
            </Col>
          ))}
        </Row>
      </main>
    );

  return (
    <main className="shop-main catalog">
      <aside className="filters">
        <h6>CATEGORY</h6>
        <Form.Select
          aria-label="Category"
          value={category}
          onChange={(e) => changeCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </Form.Select>
        <h6>PRICE RANGE</h6>
        <Form.Range
          aria-label="Maximum price"
          min="0"
          max="2000"
          step="10"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <div className="d-flex justify-content-between">
          <span>$0</span>
          <span>
            {money(price)}
            {price === 2000 ? "+" : ""}
          </span>
        </div>
        <h6>RATING</h6>
        <Form.Check
          id="rating-filter"
          label={
            <>
              <span className="stars">★★★★☆</span> & Up
            </>
          }
          checked={rating}
          onChange={(e) => setRating(e.target.checked)}
        />
        <Button
          variant="outline-primary"
          className="mt-4"
          onClick={() => {
            setPrice(2000);
            setRating(false);
            setParams({});
            setSort("title-asc");
          }}
        >
          Clear filters
        </Button>
      </aside>
      <section className="catalog-results">
        <div className="catalog-heading">
          <div>
            <h1 className="h6 mb-1">
              {query
                ? "Results for “" + query + "”"
                : category
                  ? categories.find((item) => item.slug === category)?.name ||
                    category
                  : "All Products"}
            </h1>
            <p className="muted mb-0">
              Showing {total ? (page - 1) * 12 + 1 : 0}–
              {Math.min(page * 12, total)} of {total} results
            </p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="muted">Sort by:</span>
            <Form.Select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="title-asc">Title: A–Z</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Highest Rating</option>
            </Form.Select>
          </div>
        </div>
        <ErrorBox error={error} retry={() => setReload(reload + 1)} />
        {loading ? (
          <Loading />
        ) : (
          <>
            <Row className="g-4">
              {products.map((product) => (
                <Col xl={4} sm={6} key={product.id}>
                  <Card className="product-card">
                    <Link
                      to={"/products/" + product.id}
                      className="product-image"
                    >
                      <Card.Img src={product.thumbnail} alt={product.title} />
                      <span className="discount">
                        -{Math.round(product.discountPercentage)}%
                      </span>
                    </Link>
                    <Card.Body>
                      <div className="d-flex justify-content-between gap-2">
                        <Link
                          className="product-title"
                          to={"/products/" + product.id}
                        >
                          {product.title}
                        </Link>
                        <span className="text-nowrap">
                          <span className="stars">★</span>{" "}
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="product-description muted">
                        {product.description}
                      </p>
                      <div className="d-flex align-items-center justify-content-between">
                        <strong className="price">
                          {money(product.price)}
                        </strong>
                        <Button
                          size="sm"
                          aria-label={"Add " + product.title + " to cart"}
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                        >
                          <Icon name="cart-plus" /> Add
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            {products.length === 0 && (
              <div className="empty">No products match these filters.</div>
            )}
            <Pages page={page} total={total} size={12} setPage={setPage} />
          </>
        )}
      </section>
    </main>
  );
}
