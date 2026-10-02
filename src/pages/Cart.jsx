import { Link } from "react-router-dom";
import { Row, Col, Button } from "react-bootstrap";
import { money } from "../api";
import { Icon } from "../components/Common";

export function OrderSummary({ cart, children }) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  return (
    <section className="panel order-summary">
      <h2 className="h4 mb-4">Order Summary</h2>
      <div className="summary-line">
        <span>Subtotal</span>
        <strong>{money(subtotal)}</strong>
      </div>
      <div className="summary-line">
        <span>Shipping</span>
        <strong className="text-success">Free</strong>
      </div>
      <div className="summary-line">
        <span>Estimated Tax (8%)</span>
        <strong>{money(subtotal * 0.08)}</strong>
      </div>
      <hr />
      <div className="summary-line total">
        <strong>Total</strong>
        <strong className="price">{money(subtotal * 1.08)}</strong>
      </div>
      {children}
    </section>
  );
}

export default function Cart({ cart, setCart }) {
  function quantity(id, change) {
    setCart(
      cart.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item,
      ),
    );
  }
  return (
    <main className="shop-main">
      <h1 className="mb-5">Your Shopping Cart</h1>
      {!cart.length ? (
        <div className="empty">
          <Icon name="cart3" />
          <h2>Your cart is empty</h2>
          <p>Find your next favorite product.</p>
          <Button as={Link} to="/products">
            Browse Products
          </Button>
        </div>
      ) : (
        <Row className="g-4">
          <Col lg={8}>
            {cart.map((item) => (
              <section className="panel cart-item" key={item.id}>
                <img src={item.thumbnail} alt={item.title} />
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between gap-2">
                    <Link to={"/products/" + item.id}>
                      <h2 className="h4">{item.title}</h2>
                    </Link>
                    <strong className="price h4">
                      {money(item.price * item.quantity)}
                    </strong>
                  </div>
                  <p className="muted">{money(item.price)} each</p>
                  <div className="d-flex justify-content-between">
                    <div className="quantity-stepper">
                      <Button
                        variant="link"
                        aria-label={"Decrease " + item.title + " quantity"}
                        disabled={item.quantity === 1}
                        onClick={() => quantity(item.id, -1)}
                      >
                        −
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        variant="link"
                        aria-label={"Increase " + item.title + " quantity"}
                        onClick={() => quantity(item.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="link"
                      className="text-danger"
                      onClick={() =>
                        setCart(cart.filter((row) => row.id !== item.id))
                      }
                    >
                      <Icon name="trash" /> Remove
                    </Button>
                  </div>
                </div>
              </section>
            ))}
          </Col>
          <Col lg={4}>
            <OrderSummary cart={cart}>
              <Button as={Link} to="/checkout" className="w-100 mt-4" size="lg">
                Proceed to Checkout →
              </Button>
              <p className="muted small mt-3 text-center">
                Review your details before placing your demo order.
              </p>
            </OrderSummary>
            <Link to="/products" className="d-block mt-4">
              ← Continue shopping
            </Link>
          </Col>
        </Row>
      )}
    </main>
  );
}
