import { useState, useEffect } from "react";
import { customerAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  companyName: "",
  servicePlan: "Basic",
  accountStatus: "Active",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = Create, number = Edit
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Load all customers on first mount
  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await customerAPI.getAll();
      setCustomers(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load customers. Is the backend running?",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Open Modal for Create or Edit
  const openCreateModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingId(customer.customerId);
    setFormData({
      fullName: customer.fullName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      companyName: customer.companyName || "",
      servicePlan: customer.servicePlan || "Basic",
      accountStatus: customer.accountStatus || "Active",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Update single form field
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Create or Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      if (editingId === null) {
        await customerAPI.create(formData);
      } else {
        await customerAPI.update(editingId, formData);
      }
      setIsModalOpen(false);
      await fetchCustomers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save customer.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Customer
  const handleDelete = async (customerId, fullName) => {
    if (!window.confirm(`Delete customer "${fullName}" (#${customerId})?`))
      return;

    try {
      await customerAPI.delete(customerId);
      setCustomers((prev) => prev.filter((c) => c.customerId !== customerId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete customer.");
    }
  };

  // Derived stats & search filtering
  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.fullName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      String(c.customerId).includes(q)
    );
  });

  const activeCount = customers.filter(
    (c) => c.accountStatus === "Active",
  ).length;
  const premiumCount = customers.filter(
    (c) => c.servicePlan === "Premium",
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
        }}
      >
        <div className="card card-interactive">
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Total Customers
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "6px" }}>
            {customers.length}
          </div>
        </div>
        <div className="card card-interactive">
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Active Accounts
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
              marginTop: "6px",
              color: "#22c55e",
            }}
          >
            {activeCount}
          </div>
        </div>
        <div className="card card-interactive">
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Premium Plan
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
              marginTop: "6px",
              color: "var(--accent)",
            }}
          >
            {premiumCount}
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Add Button */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          display: "flex",
          gap: "12px",
          justifyContent: "space-between",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          style={{ position: "relative", flex: "1 1 260px", maxWidth: "380px" }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "18px",
              color: "var(--text-muted)",
            }}
          >
            search
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Search by ID, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px" }}
          />
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px" }}
          >
            add
          </span>
          Add Customer
        </button>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            Loading customers...
          </div>
        ) : error ? (
          <div
            style={{ padding: "32px", textAlign: "center", color: "#ef4444" }}
          >
            <p style={{ marginBottom: "12px" }}>{error}</p>
            <button className="btn" onClick={fetchCustomers}>
              Retry
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            No customers found. Click <strong>Add Customer</strong> to create
            one.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 600, color: "var(--accent)" }}>
                      #{c.customerId}
                    </td>
                    <td style={{ fontWeight: 500 }}>{c.fullName}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {c.email}
                    </td>
                    <td>{c.phone}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {c.companyName || "—"}
                    </td>
                    <td>
                      <StatusBadge label={c.servicePlan} />
                    </td>
                    <td>
                      <StatusBadge label={c.accountStatus} />
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        className="btn"
                        onClick={() => openEditModal(c)}
                        style={{ marginRight: "8px", padding: "5px 10px" }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "16px" }}
                        >
                          edit
                        </span>
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(c.customerId, c.fullName)}
                        style={{ padding: "5px 10px" }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "16px" }}
                        >
                          delete
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 600 }}>
                {editingId === null
                  ? "Add New Customer"
                  : `Edit Customer #${editingId}`}
              </h2>
              <button
                className="btn"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: "4px 8px" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px" }}
                >
                  close
                </span>
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(239,68,68,0.12)",
                  color: "#ef4444",
                  fontSize: "13px",
                  marginBottom: "14px",
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input
                  className="form-input"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  className="form-input"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Service Plan</label>
                  <select
                    className="form-select"
                    name="servicePlan"
                    value={formData.servicePlan}
                    onChange={handleChange}
                  >
                    <option value="Basic">Basic</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select
                    className="form-select"
                    name="accountStatus"
                    value={formData.accountStatus}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId === null
                      ? "Create Customer"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
