import { useState, useEffect } from 'react';
import { categoryAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const EMPTY_FORM = {
  categoryName: '',
  description: '',
  isActive: true,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await categoryAPI.getAll();
      setCategories(res.data?.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load knowledge categories. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategoryId(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategoryId(cat.categoryId);
    setFormData({
      categoryName: cat.categoryName || '',
      description: cat.description || '',
      isActive: cat.isActive ?? true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      if (editingCategoryId === null) {
        await categoryAPI.create({
          categoryName: formData.categoryName,
          description: formData.description,
        });
      } else {
        await categoryAPI.update(editingCategoryId, {
          categoryName: formData.categoryName,
          description: formData.description,
          isActive: formData.isActive,
        });
      }
      setIsModalOpen(false);
      await fetchCategories();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (categoryId, categoryName) => {
    if (!window.confirm(`Deactivate category "${categoryName}" (${categoryId})?`)) return;

    try {
      await categoryAPI.deactivate(categoryId);
      setCategories((prev) =>
        prev.map((c) => (c.categoryId === categoryId ? { ...c, isActive: false } : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate category.');
    }
  };

  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.categoryId?.toLowerCase().includes(q) ||
      c.categoryName?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div className="card card-interactive">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Categories</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px' }}>{categories.length}</div>
        </div>
        <div className="card card-interactive">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active Categories</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px', color: '#22c55e' }}>{activeCount}</div>
        </div>
        <div className="card card-interactive">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Inactive Categories</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px', color: '#ef4444' }}>
            {categories.length - activeCount}
          </div>
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
            placeholder="Search by ID, name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading categories...
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#ef4444' }}>
            <p style={{ marginBottom: '12px' }}>{error}</p>
            <button className="btn" onClick={fetchCategories}>Retry</button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No categories found. Click <strong>Add Category</strong> to create one.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat._id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{cat.categoryId}</td>
                    <td style={{ fontWeight: 500 }}>{cat.categoryName}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '360px' }}>
                      {cat.description || '—'}
                    </td>
                    <td><StatusBadge label={cat.isActive ? 'Active' : 'Inactive'} /></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn"
                        title="Edit Category"
                        onClick={() => openEditModal(cat)}
                        style={{ marginRight: '8px', padding: '5px 10px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                      </button>
                      {cat.isActive && (
                        <button
                          className="btn btn-danger"
                          title="Deactivate Category"
                          onClick={() => handleDeactivate(cat.categoryId, cat.categoryName)}
                          style={{ padding: '5px 10px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>block</span>
                        </button>
                      )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
                {editingCategoryId === null ? 'Add Knowledge Category' : `Edit ${editingCategoryId}`}
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
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  className="form-input"
                  name="categoryName"
                  placeholder="e.g. Account & Authentication"
                  value={formData.categoryName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  name="description"
                  rows={3}
                  placeholder="Short description of articles in this category"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {editingCategoryId !== null && (
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input
                    id="isActive"
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                  />
                  <label htmlFor="isActive" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                    Category is Active
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingCategoryId === null ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
