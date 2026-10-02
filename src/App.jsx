import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Navbar, Nav, Container, Form, Button, Alert } from "react-bootstrap";
import { api, readStorage } from "./api";
import { Icon } from "./components/Common";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState(() => readStorage("hamdyshop-cart", []));
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("hamdyshop-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    async function restoreLogin() {
      const token = localStorage.getItem("hamdyshop-token");
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        setUser(await api("/auth/me", "GET", undefined, token));
      } catch (error) {
        // Refresh an expired token without asking for the password again.
        try {
          const result = await api("/auth/refresh", "POST", {
            refreshToken: localStorage.getItem("hamdyshop-refresh"),
          });
          localStorage.setItem("hamdyshop-token", result.accessToken);
          localStorage.setItem("hamdyshop-refresh", result.refreshToken);
          setUser(await api("/auth/me", "GET", undefined, result.accessToken));
        } catch {
          localStorage.removeItem("hamdyshop-token");
          localStorage.removeItem("hamdyshop-refresh");
          setNotice("Your session ended. Please sign in again.");
        }
      } finally {
        setAuthLoading(false);
      }
    }
    restoreLogin();
  }, []);

  function addToCart(product, quantity = 1) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found)
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      return [
        ...current,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          thumbnail: product.thumbnail,
          quantity,
        },
      ];
    });
    setNotice(product.title + " added to your cart.");
  }
  function logout() {
    setUser(null);
    localStorage.removeItem("hamdyshop-token");
    localStorage.removeItem("hamdyshop-refresh");
    navigate("/login");
  }

  return (
    <>
      <Navbar
        expand="lg"
        className={
          location.pathname.startsWith("/admin/")
            ? "shop-nav d-none"
            : "shop-nav"
        }
      >
        <Container fluid>
          <Navbar.Brand as={Link} to="/">
            hamdyshop
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/" end>
                Home
              </Nav.Link>
              <Nav.Link as={NavLink} to="/products">
                Products
              </Nav.Link>
              <Nav.Link as={NavLink} to="/categories">
                Categories
              </Nav.Link>
            </Nav>
            <Form
              className="nav-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate("/products?q=" + encodeURIComponent(search));
              }}
            >
              <Icon name="search" />
              <Form.Control
                aria-label="Search products"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Form>
            <Link to="/cart" className="nav-icon" aria-label="Shopping cart">
              <Icon name="cart3" />
              {cart.length > 0 && (
                <span className="cart-count">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Link>
            <Link
              to={user ? "/profile" : "/login"}
              className="nav-icon"
              aria-label="My account"
            >
              <Icon name="person-circle" />
            </Link>
            <Button
              as={Link}
              to="/admin/products"
              variant="outline-primary"
              size="sm"
            >
              Admin
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {notice && (
        <Alert
          className="site-notice"
          variant="success"
          dismissible
          onClose={() => setNotice("")}
        >
          {notice}
        </Alert>
      )}
      <Routes>
        <Route path="/" element={<Products addToCart={addToCart} />} />
        <Route path="/products" element={<Products addToCart={addToCart} />} />
        <Route
          path="/categories"
          element={<Products addToCart={addToCart} categoriesOnly />}
        />
        <Route
          path="/products/:id"
          element={<ProductDetails addToCart={addToCart} />}
        />
        <Route path="/login" element={<Auth setUser={setUser} />} />
        <Route path="/register" element={<Auth register setUser={setUser} />} />
        <Route
          path="/profile"
          element={
            <Profile
              user={user}
              setUser={setUser}
              logout={logout}
              authLoading={authLoading}
            />
          }
        />
        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
        <Route
          path="/checkout"
          element={<Checkout cart={cart} setCart={setCart} user={user} />}
        />
        <Route
          path="/admin/:resource"
          element={<Dashboard key={location.pathname} />}
        />
        <Route
          path="*"
          element={
            <main className="shop-main">
              <h1>Page not found</h1>
              <Link to="/products">Back to products</Link>
            </main>
          }
        />
      </Routes>
      <footer>
        hamdyshop <span>Simple shopping, thoughtfully made.</span>
      </footer>
    </>
  );
}
