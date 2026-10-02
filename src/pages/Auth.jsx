import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";
import { api } from "../api";

export default function Auth({ register, setUser }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (register) {
        await api("/users/add", "POST", form);
        setMessage(
          "Mock registration successful. DummyJSON does not save new accounts. Use the demo login below to sign in.",
        );
      } else {
        let username = form.username.trim();
        if (username.includes("@")) {
          const result = await api(
            "/users/filter?key=email&value=" + encodeURIComponent(username),
          );
          if (!result.users.length)
            throw new Error("No user found with this email.");
          username = result.users[0].username;
        }
        const data = await api("/auth/login", "POST", {
          username,
          password: form.password,
        });
        localStorage.setItem("hamdyshop-token", data.accessToken);
        localStorage.setItem("hamdyshop-refresh", data.refreshToken);
        setUser(await api("/auth/me", "GET", undefined, data.accessToken));
        navigate("/profile");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="panel auth-panel">
        <div className="brand mb-4">hamdyshop</div>
        <h1>{register ? "Create an account" : "Welcome back"}</h1>
        <p className="muted">
          {register
            ? "Start your shopping journey."
            : "Sign in to your hamdyshop account."}
        </p>
        {error && <Alert variant="danger">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}
        <Form onSubmit={submit}>
          {register && (
            <>
              <Form.Label htmlFor="firstName">First name</Form.Label>
              <Form.Control
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={change}
                required
              />
              <Form.Label htmlFor="lastName">Last name</Form.Label>
              <Form.Control
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={change}
                required
              />
              <Form.Label htmlFor="email">Email address</Form.Label>
              <Form.Control
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={change}
                required
              />
            </>
          )}
          <Form.Label htmlFor="username">
            {register ? "Username" : "Username or email"}
          </Form.Label>
          <Form.Control
            id="username"
            name="username"
            value={form.username}
            onChange={change}
            required
            autoComplete="username"
          />
          <Form.Label htmlFor="password">Password</Form.Label>
          <Form.Control
            id="password"
            type="password"
            name="password"
            minLength={register ? 6 : 1}
            value={form.password}
            onChange={change}
            required
            autoComplete={register ? "new-password" : "current-password"}
          />
          <Button type="submit" className="w-100 mt-4" disabled={busy}>
            {busy ? "Please wait..." : register ? "Create account" : "Sign in"}
          </Button>
        </Form>
        <p className="mt-4 text-center">
          {register ? "Already have an account? " : "New to hamdyshop? "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Register"}
          </Link>
        </p>
        <div className="demo-login">
          Demo username: <strong>emilys</strong>
          <br />
          Password: <strong>emilyspass</strong>
          {!register && (
            <Button
              variant="link"
              onClick={() =>
                setForm({ ...form, username: "emilys", password: "emilyspass" })
              }
            >
              Use demo credentials
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
