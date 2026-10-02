import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Row, Col, Button, Form, Badge } from "react-bootstrap";
import { api, money } from "../api";
import { Loading, ErrorBox } from "../components/Common";

export default function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [image, setImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    setProduct(null);
    setError("");
    api("/products/" + id)
      .then((data) => {
        setProduct(data);
        setImage(data.images[0]);
      })
      .catch((error) => setError(error.message));
  }, [id, reload]);
  return (
    <main className="shop-main">
      <p className="breadcrumb-line">
        <Link to="/">Home</Link> › <Link to="/products">Products</Link> ›{" "}
        {product?.title || "Product"}
      </p>
      <ErrorBox error={error} retry={() => setReload(reload + 1)} />
      {!product && !error ? (
        <Loading />
      ) : (
        product && (
          <>
            <Row className="g-4">
              <Col lg={7}>
                <div className="gallery">
                  <div className="thumbnails">
                    {product.images.map((url) => (
                      <button
                        key={url}
                        className={image === url ? "selected" : ""}
                        onClick={() => setImage(url)}
                        aria-label="View product image"
                      >
                        <img src={url} alt={product.title} />
                      </button>
                    ))}
                  </div>
                  <div className="detail-image">
                    <img src={image} alt={product.title} />
                  </div>
                </div>
              </Col>
              <Col lg={5}>
                <Badge className="mint">{product.availabilityStatus}</Badge>{" "}
                <small>SKU: {product.sku}</small>
                <h1 className="mt-3">{product.title}</h1>
                <p>
                  <span className="stars">★★★★★</span>{" "}
                  <strong>{product.rating}</strong> ·{" "}
                  {product.reviews?.length || 0} Reviews
                </p>
                <div className="detail-price">{money(product.price)}</div>
                <p className="muted">Shipping calculated at checkout.</p>
                <hr />
                <p className="description">{product.description}</p>
                <p>
                  {product.warrantyInformation} · {product.shippingInformation}
                </p>
                <Form.Label htmlFor="quantity">Quantity</Form.Label>
                <Form.Control
                  id="quantity"
                  type="number"
                  min="1"
                  max={Math.max(product.stock, 1)}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="quantity-input mb-3"
                />
                <Button
                  size="lg"
                  className="w-100"
                  disabled={
                    !product.stock ||
                    !Number.isInteger(Number(quantity)) ||
                    Number(quantity) < 1 ||
                    Number(quantity) > product.stock
                  }
                  onClick={() => addToCart(product, Number(quantity))}
                >
                  Add to Cart
                </Button>
                <p className="muted mt-3">
                  {product.stock} in stock · {product.returnPolicy}
                </p>
              </Col>
            </Row>
            <section className="panel mt-5">
              <h2 className="h4">Customer Reviews</h2>
              {product.reviews?.map((review, index) => (
                <div className="review" key={index}>
                  <strong>{review.reviewerName}</strong>
                  <span className="stars ms-3">
                    {"★".repeat(review.rating)}
                  </span>
                  <p>{review.comment}</p>
                </div>
              ))}
            </section>
          </>
        )
      )}
    </main>
  );
}
