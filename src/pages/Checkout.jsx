import { useState } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Form, Button, Alert } from "react-bootstrap";
import { api, money, readStorage } from "../api";
import { OrderSummary } from "./Cart";
import { Icon } from "../components/Common";

export default function Checkout({ cart, setCart, user }) {
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    address: "",
    city: "",
    zip: "",
    phone: "",
  });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function change(e) {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  }
  async function placeOrder() {
    setBusy(true);
    setError("");
    try {
      const result = await api("/carts/add", "POST", {
        userId: user?.id || 1,
        products: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
      });
      const completed = {
        ...result,
        localId: Date.now(),
        userId: user?.id || 1,
        products: [...cart],
        shipping,
        date: new Date().toISOString(),
      };
      localStorage.setItem(
        "hamdyshop-orders",
        JSON.stringify([...readStorage("hamdyshop-orders", []), completed]),
      );
      setOrder(completed);
      setCart([]);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (order)
    return (
      <main className="shop-main">
        <div className="confirmation">
          <span className="success-circle">
            <Icon name="check-lg" />
          </span>
          <h1>Order #{order.localId.toString().slice(-6)} Confirmed</h1>
          <p>Your demo order has been placed successfully.</p>
          <p className="muted">
            Confirmation for <span className="price">{shipping.email}</span>. No
            payment was taken or email sent.
          </p>
        </div>
        <Row className="g-4">
          <Col lg={8}>
            <section className="panel">
              <h2 className="h4">Estimated Delivery</h2>
              <p className="text-success">Your demo order is being prepared.</p>
              <div className="delivery-steps">
                <span>✓ Order placed</span>
                <span>Package preparation</span>
                <span>Delivery</span>
              </div>
              <hr />
              <h3 className="h5">Shipping Address</h3>
              <p>
                {shipping.firstName} {shipping.lastName}
                <br />
                {shipping.address}
                <br />
                {shipping.city}, {shipping.zip}
              </p>
              <Button as={Link} to="/products">
                Continue Shopping
              </Button>
            </section>
          </Col>
          <Col lg={4}>
            <OrderSummary cart={order.products} />
            {order.products.map((item) => (
              <p key={item.id} className="mt-3">
                {item.title} × {item.quantity}{" "}
                <strong>{money(item.price * item.quantity)}</strong>
              </p>
            ))}
          </Col>
        </Row>
      </main>
    );
  if (!cart.length)
    return (
      <main className="shop-main empty">
        <h1>Your cart is empty</h1>
        <Button as={Link} to="/products">
          Browse Products
        </Button>
      </main>
    );
  return (
    <main className="shop-main">
      <h1>Secure Checkout</h1>
      <p className="muted mb-5">Complete your hamdyshop demo order.</p>
      <Row className="g-5">
        <Col lg={8}>
          <div className="checkout-steps">
            {["Shipping", "Payment", "Review"].map((label, index) => (
              <span key={label} className={step === index + 1 ? "active" : ""}>
                <b>{index + 1}</b>
                {label}
              </span>
            ))}
          </div>
          <section className="panel mt-4">
            <ErrorBoxInline error={error} />
            {step === 1 && (
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
              >
                <h2 className="h4 mb-4">
                  <Icon name="truck" /> Shipping Information
                </h2>
                <Row className="g-3">
                  {Object.keys(shipping).map((key) => (
                    <Col
                      md={key === "address" || key === "email" ? 12 : 6}
                      key={key}
                    >
                      <Form.Label htmlFor={"shipping-" + key}>
                        {{
                          firstName: "First Name",
                          lastName: "Last Name",
                          zip: "Zip Code",
                          phone: "Phone Number",
                        }[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                      </Form.Label>
                      <Form.Control
                        id={"shipping-" + key}
                        type={
                          key === "email"
                            ? "email"
                            : key === "phone"
                              ? "tel"
                              : "text"
                        }
                        name={key}
                        value={shipping[key]}
                        onChange={change}
                        required
                      />
                    </Col>
                  ))}
                </Row>
                <Button type="submit" className="mt-4">
                  Continue to Payment →
                </Button>
              </Form>
            )}
            {step === 2 && (
              <>
                <h2 className="h4">Payment</h2>
                <p className="muted">
                  This is a practice checkout. No real card details or payment
                  are needed.
                </p>
                <Form.Check
                  id="demo-payment"
                  type="radio"
                  name="payment"
                  label="Demo payment"
                  defaultChecked
                />
                <div className="d-flex gap-3 mt-4">
                  <Button variant="outline-primary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)}>Review Order →</Button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <h2 className="h4">Review Your Order</h2>
                <p>
                  {shipping.firstName} {shipping.lastName}
                  <br />
                  {shipping.address}, {shipping.city}, {shipping.zip}
                  <br />
                  {shipping.email}
                </p>
                {cart.map((item) => (
                  <div className="summary-line" key={item.id}>
                    <span>
                      {item.title} × {item.quantity}
                    </span>
                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                ))}
                <div className="d-flex gap-3 mt-4">
                  <Button
                    variant="outline-primary"
                    disabled={busy}
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button disabled={busy} onClick={placeOrder}>
                    {busy ? "Placing order..." : "Place Demo Order"}
                  </Button>
                </div>
              </>
            )}
          </section>
        </Col>
        <Col lg={4}>
          <OrderSummary cart={cart}>
            <hr />
            {cart.map((item) => (
              <div className="checkout-product" key={item.id}>
                <img src={item.thumbnail} alt={item.title} />
                <div>
                  <strong>{item.title}</strong>
                  <p className="mb-0">
                    Qty: {item.quantity} · {money(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </OrderSummary>
        </Col>
      </Row>
    </main>
  );
}
function ErrorBoxInline({ error }) {
  return error && <Alert variant="danger">{error}</Alert>;
}
