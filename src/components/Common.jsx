import { Alert, Button, Spinner, Pagination } from "react-bootstrap";

export function Icon({ name }) {
  return <i className={"bi bi-" + name} aria-hidden="true" />;
}
export function Loading() {
  return (
    <div className="loading">
      <Spinner animation="border" />
      <span>Loading...</span>
    </div>
  );
}
export function ErrorBox({ error, retry }) {
  return error ? (
    <Alert variant="danger">
      {error}{" "}
      {retry && (
        <Button variant="outline-danger" size="sm" onClick={retry}>
          Try again
        </Button>
      )}
    </Alert>
  ) : null;
}
export function Pages({ page, total, size, setPage }) {
  const last = Math.max(1, Math.ceil(total / size));
  return (
    <div className="page-controls">
      <span>
        {total} results · Page {page} of {last}
      </span>
      <Pagination className="mb-0">
        <Pagination.Prev
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        />
        <Pagination.Item active>{page}</Pagination.Item>
        <Pagination.Next
          disabled={page >= last}
          onClick={() => setPage(page + 1)}
        />
      </Pagination>
    </div>
  );
}
export function Stats({ items }) {
  return (
    <div className="stats">
      {items.map((item) => (
        <div className="stat" key={item.label}>
          <span className="stat-icon">
            <Icon name={item.icon} />
          </span>
          <div>
            <span className="muted label">{item.label}</span>
            <h3>{item.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
