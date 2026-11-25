import { useState, useEffect } from 'react';
import { ticketAPI, customerAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const EMPTY_CREATE_FORM = {
  customerId: '',
  subject: '',
  description: '',
  priority: 'Medium',
  channel: 'Web',
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_CREATE_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // ML Details Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ticketsRes, customersRes] = await Promise.all([
        ticketAPI.getAll(),
        customerAPI.getAll(),
      ]);
      setTickets(ticketsRes.data?.supportRequests || []);
      setCustomers(customersRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load support tickets. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingTicketId(null);
    setFormData({
      ...EMPTY_CREATE_FORM,
      customerId: customers[0]?.customerId ? String(customers[0].customerId) : '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (ticket) => {
    setEditingTicketId(ticket.ticketId);
    setFormData({
      subject: ticket.subject || '',
      description: ticket.description || '',
      priority: ticket.priority || 'Medium',
      status: ticket.status || 'Open',
      channel: ticket.channel || 'Web',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      if (editingTicketId === null) {
        await ticketAPI.create({
          customerId: Number(formData.customerId),
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          channel: formData.channel,
        });
      } else {
        await ticketAPI.update(editingTicketId, {
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          channel: formData.channel,
        });
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save support ticket.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm(`Delete support ticket #${ticketId}?`)) return;
    try {
      await ticketAPI.delete(ticketId);
      setTickets((prev) => prev.filter((t) => t.ticketId !== ticketId));
      if (selectedTicket?.ticketId === ticketId) setSelectedTicket(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete support ticket.');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase();
    return (
      String(t.ticketId).includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.customer?.fullName?.toLowerCase().includes(q)
    );
  });

  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const reviewCount = tickets.filter((t) => t.category === 'Needs agent review').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div className="card card-interactive">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Tickets</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px' }}>{tickets.length}</div>
        </div>
        <div className="card card-interactive">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Open Tickets</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px', color: '#38bdf8' }}>{openCount}</div>
        </div>
        <div className="card card-interactive">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Needs Agent Review (ML &lt; 60%)</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px', color: 'var(--accent)' }}>{reviewCount}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
          <span
            className="material-symbols-outlined"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--text-muted)' }}
          >
            search
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Search by ticket ID, subject, category, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Raise Ticket
        </button>
      </div>

      {/* Tickets Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading support tickets...
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#ef4444' }}>
            <p style={{ marginBottom: '12px' }}>{error}</p>
            <button className="btn" onClick={fetchData}>Retry</button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No support tickets found. Click <strong>Raise Ticket</strong> to create one.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>ML Category</th>
                  <th>Confidence</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Channel</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>#{t.ticketId}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.customer?.fullName || 'Unknown'}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        ID: #{t.customer?.customerId ?? '—'}
                      </div>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.subject}
                      </div>
                    </td>
                    <td><StatusBadge label={t.category} /></td>
                    <td style={{ fontWeight: 600 }}>
                      {typeof t.confidence === 'number' ? `${Math.round(t.confidence * 100)}%` : '0%'}
                    </td>
                    <td><StatusBadge label={t.priority} /></td>
                    <td><StatusBadge label={t.status} /></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.channel}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn"
                        title="View ML Breakdown"
                        onClick={() => setSelectedTicket(t)}
                        style={{ marginRight: '6px', padding: '5px 10px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--accent)' }}>psychology</span>
                      </button>
                      <button
                        className="btn"
                        title="Edit Ticket"
                        onClick={() => openEditModal(t)}
                        style={{ marginRight: '6px', padding: '5px 10px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                      </button>
                      <button
                        className="btn btn-danger"
                        title="Delete Ticket"
                        onClick={() => handleDelete(t.ticketId)}
                        style={{ padding: '5px 10px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Ticket Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
                {editingTicketId === null ? 'Raise Support Ticket' : `Update Ticket #${editingTicketId}`}
              </h2>
              <button className="btn" onClick={() => setIsModalOpen(false)} style={{ padding: '4px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '13px', marginBottom: '14px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {editingTicketId === null && (
                <div className="form-group">
                  <label className="form-label">Customer *</label>
                  {customers.length > 0 ? (
                    <select
                      className="form-select"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a customer...</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c.customerId}>
                          #{c.customerId} — {c.fullName} ({c.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="form-input"
                      type="number"
                      name="customerId"
                      placeholder="Enter Customer ID (e.g. 1001)"
                      value={formData.customerId}
                      onChange={handleChange}
                      required
                    />
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input
                  className="form-input"
                  name="subject"
                  placeholder="Short title of the issue"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-textarea"
                  name="description"
                  rows={4}
                  placeholder="Describe the issue in detail (used by ML classifier)"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: editingTicketId !== null ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" name="priority" value={formData.priority} onChange={handleChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Channel</label>
                  <select className="form-select" name="channel" value={formData.channel} onChange={handleChange}>
                    <option value="Web">Web</option>
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>

                {editingTicketId !== null && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Running ML & Saving...' : editingTicketId === null ? 'Submit Ticket' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ML Classification Detail Modal */}
      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
                Ticket #{selectedTicket.ticketId} — ML Classification
              </h2>
              <button className="btn" onClick={() => setSelectedTicket(null)} style={{ padding: '4px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedTicket.subject}</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                {selectedTicket.description}
              </p>
            </div>

            <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Assigned Category</span>
                <StatusBadge label={selectedTicket.category} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Raw Model Prediction</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{selectedTicket.modelCategory || 'Unavailable'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Confidence Score</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
                  {Math.round((selectedTicket.confidence || 0) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Category Probabilities
              </div>
              {selectedTicket.categoryProbabilities && Object.keys(selectedTicket.categoryProbabilities).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(selectedTicket.categoryProbabilities)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, prob]) => {
                      const pct = Math.round(prob * 100);
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                            <span>{cat}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
                          </div>
                          <div style={{ height: '6px', borderRadius: '999px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                backgroundColor: cat === selectedTicket.modelCategory ? 'var(--accent)' : 'var(--text-muted)',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  No probability breakdown available (ML service may have been offline).
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
