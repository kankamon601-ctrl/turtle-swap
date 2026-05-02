import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getItem,
  updateItem,
  uploadItemImages,
  deleteItemImage,
} from '../services/api';
import './EditItem.css';

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics & Components' },
  { value: 'automotive', label: 'Automotive & Mechanical' },
  { value: 'home',        label: 'Home & Furniture' },
  { value: 'garden',      label: 'Garden & Outdoor' },
  { value: 'sports',      label: 'Sports' },
  { value: 'books',       label: 'Books' },
  { value: 'hardware',    label: 'Hardware & Materials' },
  { value: 'fashion',     label: 'Fashion' },
  { value: 'other',       label: 'Other' },
];

const CONDITIONS = [
  { value: 'new',      label: 'New — never used' },
  { value: 'like_new', label: 'Like new — barely used' },
  { value: 'good',     label: 'Good — normal wear' },
  { value: 'fair',     label: 'Fair — visible wear' },
];

function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadItem = async () => {
    try {
      const res = await getItem(id);
      const item = res.data.item;
      setTitle(item.title);
      setDescription(item.description || '');
      setCategory(item.category);
      setCondition(item.condition);
      setExistingImages(item.images || []);
    } catch (err) {
      setError('Could not load item');
    }
    setLoading(false);
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Remove this photo?')) return;
    try {
      await deleteItemImage(id, imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError('Failed to remove image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !category || !condition) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await updateItem(id, { title, description, category, condition });

      if (newImages.length > 0) {
        const maxNew = 4 - existingImages.length;
        if (newImages.length > maxNew) {
          setError(
            `You can only add ${maxNew} more image${maxNew !== 1 ? 's' : ''} (4 max total). Remove existing photos first.`
          );
          setSaving(false);
          return;
        }
        await uploadItemImages(id, newImages);
      }

      setSuccess(true);
      setTimeout(() => navigate('/my-items'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="state-block">
          <span className="eyebrow">Loading</span>
          <p className="state-block-msg">Fetching listing…</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page">
        <div className="state-block">
          <span className="eyebrow">Saved</span>
          <h2 className="state-block-title">Changes are live</h2>
          <p className="state-block-msg">Heading back to your listings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="edit-nav">
        <button
          className="edit-back"
          onClick={() => navigate('/my-items')}
          aria-label="Back to listings"
        >
          <IconChevronLeft />
          <span>Back to listings</span>
        </button>
      </div>

      <header className="edit-header">
        <span className="eyebrow">Listing</span>
        <h1 className="edit-title">Edit listing</h1>
      </header>

      <form className="edit-form" onSubmit={handleSubmit}>
        {error && <div className="error-msg">{error}</div>}

        {/* Existing photos */}
        {existingImages.length > 0 && (
          <div className="edit-section">
            <span className="eyebrow edit-section-eyebrow">Current photos</span>
            <div className="edit-images-grid">
              {existingImages.map((img) => (
                <div key={img.id} className="edit-image-thumb">
                  <img src={img.image_url} alt="" />
                  <button
                    type="button"
                    className="edit-image-remove"
                    onClick={() => handleDeleteImage(img.id)}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add photos */}
        <div className="edit-section">
          <span className="eyebrow edit-section-eyebrow">
            Add photos · {existingImages.length}/4 used
          </span>
          <input
            type="file"
            className="input"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files);
              const maxNew = 4 - existingImages.length;
              if (files.length > maxNew) {
                setError(
                  `You can only add ${maxNew} more image${maxNew !== 1 ? 's' : ''}. Remove existing photos to make room.`
                );
                e.target.value = '';
                setNewImages([]);
                return;
              }
              setError('');
              setNewImages(files);
            }}
          />
          {newImages.length > 0 && (
            <p className="edit-section-hint" style={{ marginTop: 8 }}>
              {newImages.length} new image{newImages.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Details */}
        <div className="edit-section">
          <span className="eyebrow edit-section-eyebrow">Details</span>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="input select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Condition</label>
            <select
              className="input select"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="">Select condition</option>
              {CONDITIONS.map((cond) => (
                <option key={cond.value} value={cond.value}>{cond.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

export default EditItem;
