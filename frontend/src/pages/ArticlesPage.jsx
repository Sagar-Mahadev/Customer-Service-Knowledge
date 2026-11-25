import { useState, useEffect } from 'react';
import { articleAPI, categoryAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const EMPTY_FORM = {
  title: '',
  problemDescription: '',
  category: '',
  troubleshootingStepsText: '',
  solution: '',
  applicableProduct: '',
  authorName: '',
  changeDescription: '',
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Version History Modal
  const [versionsModal, setVersionsModal] = useState(null);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        articleAPI.getAll(),
        categoryAPI.getAll(),
      ]);
      setArticles(articlesRes.data?.articles || []);
      setCategories((categoriesRes.data?.categories || []).filter((c) => c.isActive));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load knowledge articles. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingArticleId(null);
    setFormData({
      ...EMPTY_FORM,
      category: categories[0]?._id || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (article) => {
    setEditingArticleId(article.articleId);
    setFormData({
      title: article.title || '',
      problemDescription: article.problemDescription || '',
      category: article.category?._id || '',
      troubleshootingStepsText: (article.troubleshootingSteps || []).join('\n'),
      solution: article.solution || '',
      applicableProduct: article.applicableProduct || '',
      authorName: '',
      changeDescription: '',
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

    const steps = formData.troubleshootingStepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (steps.length === 0) {
      setFormError('Please enter at least one troubleshooting step.');
      setSaving(false);
      return;
    }

    try {
      if (editingArticleId === null) {
        await articleAPI.create({
          title: formData.title,
          problemDescription: formData.problemDescription,
          category: formData.category,
          troubleshootingSteps: steps,
          solution: formData.solution,
          applicableProduct: formData.applicableProduct,
          createdBy: formData.authorName,
        });
      } else {
        await articleAPI.update(editingArticleId, {
          title: formData.title,
          problemDescription: formData.problemDescription,
          category: formData.category,
          troubleshootingSteps: steps,
          solution: formData.solution,
          applicableProduct: formData.applicableProduct,
          updatedBy: formData.authorName,
          changeDescription: formData.changeDescription || 'Article updated',
        });
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save knowledge article.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusTransition = async (articleId, action) => {
    const updatedBy = window.prompt(`Enter your name to ${action} ${articleId}:`);
    if (!updatedBy || !updatedBy.trim()) return;

    try {
      if (action === 'approve') await articleAPI.approve(articleId, updatedBy.trim());
      if (action === 'publish') await articleAPI.publish(articleId, updatedBy.trim());
      if (action === 'retire') await articleAPI.retire(articleId, updatedBy.trim());
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} article.`);
    }
  };

  const openVersionHistory = async (articleId) => {
    setVersionsLoading(true);
    setVersionsModal({ articleId, versions: [] });
    try {
      const res = await articleAPI.getVersions(articleId);
      setVersionsModal({
        articleId,
        versions: res.data?.versions || [],
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load version history.');
      setVersionsModal(null);
    } finally {
      setVersionsLoading(false);
    }
  };

  const filteredArticles = articles.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.articleId?.toLowerCase().includes(q) ||
      a.title?.toLowerCase().includes(q) ||
      a.category?.categoryName?.toLowerCase().includes(q) ||
      a.status?.toLowerCase().includes(q)
    );
  });

  const publishedCount = articles.filter((a) => a.status === 'Published').length;
  const draftCount = articles.filter((a) => a.status === 'Draft').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div className="card card-interactive">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Articles</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px' }}>{articles.length}</div>
        </div>
        <div className="card card-interactive">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Published</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px', color: '#22c55e' }}>{publishedCount}</div>
        </div>
        <div className="card card-interactive">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Drafts Pending</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '6px', color: 'var(--accent)' }}>{draftCount}</div>
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
            placeholder="Search by article ID, title, category, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Article
        </button>
      </div>

      {/* Articles Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading knowledge articles...
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#ef4444' }}>
            <p style={{ marginBottom: '12px' }}>{error}</p>
            <button className="btn" onClick={fetchData}>Retry</button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No knowledge articles found. Click <strong>New Article</strong> to create one.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Article ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th style={{ textAlign: 'right' }}>Workflow &amp; Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((art) => (
                  <tr key={art._id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{art.articleId}</td>
                    <td style={{ maxWidth: '250px' }}>
                      <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {art.title}
                      </div>
                      {art.applicableProduct && (
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{art.applicableProduct}</div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{art.category?.categoryName || '—'}</td>
                    <td style={{ fontWeight: 600 }}>v{art.currentVersion}</td>
                    <td><StatusBadge label={art.status} /></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{art.updatedBy || art.createdBy}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {art.status === 'Draft' && (
                        <button
                          className="btn"
                          onClick={() => handleStatusTransition(art.articleId, 'approve')}
                          style={{ marginRight: '6px', padding: '5px 10px', color: '#38bdf8' }}
                        >
                          Approve
                        </button>
                      )}
                      {art.status === 'Approved' && (
                        <button
                          className="btn"
                          onClick={() => handleStatusTransition(art.articleId, 'publish')}
                          style={{ marginRight: '6px', padding: '5px 10px', color: '#22c55e' }}
                        >
                          Publish
                        </button>
                      )}
                      {art.status === 'Published' && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleStatusTransition(art.articleId, 'retire')}
                          style={{ marginRight: '6px', padding: '5px 10px' }}
                        >
                          Retire
                        </button>
                      )}

                      <button
                        className="btn"
                        title="Version History"
                        onClick={() => openVersionHistory(art.articleId)}
                        style={{ marginRight: '6px', padding: '5px 10px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
                      </button>
                      <button
                        className="btn"
                        title="Edit Article (Creates New Version)"
                        onClick={() => openEditModal(art)}
                        style={{ padding: '5px 10px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Article Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
                {editingArticleId === null ? 'Create Knowledge Article' : `Edit ${editingArticleId} (New Version)`}
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
                <label className="form-label">Title *</label>
                <input className="form-input" name="title" value={formData.title} onChange={handleChange} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-select" name="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Select active category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.categoryName} ({c.categoryId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Applicable Product</label>
                  <input
                    className="form-input"
                    name="applicableProduct"
                    placeholder="e.g. Web Portal, Billing App"
                    value={formData.applicableProduct}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Problem Description *</label>
                <textarea className="form-textarea" name="problemDescription" rows={2} value={formData.problemDescription} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Troubleshooting Steps * (one step per line)</label>
                <textarea
                  className="form-textarea"
                  name="troubleshootingStepsText"
                  rows={3}
                  placeholder={'Step 1: Verify user email\nStep 2: Clear browser cache'}
                  value={formData.troubleshootingStepsText}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Solution *</label>
                <textarea className="form-textarea" name="solution" rows={2} value={formData.solution} onChange={handleChange} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: editingArticleId ? '1fr 1fr' : '1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{editingArticleId ? 'Updated By *' : 'Created By *'}</label>
                  <input
                    className="form-input"
                    name="authorName"
                    placeholder="Your name"
                    value={formData.authorName}
                    onChange={handleChange}
                    required
                  />
                </div>

                {editingArticleId && (
                  <div className="form-group">
                    <label className="form-label">Change Description</label>
                    <input
                      className="form-input"
                      name="changeDescription"
                      placeholder="What changed in this version?"
                      value={formData.changeDescription}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingArticleId === null ? 'Create Article' : 'Save New Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {versionsModal && (
        <div className="modal-backdrop" onClick={() => setVersionsModal(null)}>
          <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
                {versionsModal.articleId} — Version History
              </h2>
              <button className="btn" onClick={() => setVersionsModal(null)} style={{ padding: '4px 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {versionsLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading versions...
              </div>
            ) : versionsModal.versions.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No versions found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {versionsModal.versions.map((v) => (
                  <div key={v._id} className="card" style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>v{v.versionNumber}</span>
                        <StatusBadge label={v.status} />
                        {v.isActive && <StatusBadge label="Active" />}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        by {v.modifiedBy}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{v.title}</div>
                    {v.changeDescription && (
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Change: {v.changeDescription}
                      </div>
                    )}
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      <strong>Solution:</strong> {v.solution}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
