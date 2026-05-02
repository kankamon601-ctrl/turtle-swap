import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItem, uploadItemImages } from '../services/api';
import './ListItem.css';

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

function ListItem() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !category || !condition) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await createItem({ title, description, category, condition });
      const itemId = res.data.item?.id;

      if (images.length > 0) {
        if (!itemId) {
          console.error('Item created but no ID returned:', res.data);
          setError('Item created but failed to get item ID for image upload');
          setLoading(false);
          return;
        }
        await uploadItemImages(itemId, images);
      }

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Create/upload error:', err);
      setError(err.response?.data?.error || 'Failed to create listing');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="page">
        <div className="state-block">
          <span className="eyebrow">Listed</span>
          <h2 className="state-block-title">Your item is live</h2>
          <p className="state-block-msg">
            Heading back to the home feed…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="list-header">
        <span className="eyebrow">New listing</span>
        <h1 className="list-title">List an item</h1>
        <p className="list-sub">
          Give your stuff a second life — someone nearby might love it.
        </p>
      </header>

      <form className="list-form" onSubmit={handleSubmit}>
        {error && <div className="error-msg">{error}</div>}

        <div className="form-group">
          <label className="form-label">Photos (max 4)</label>
          <input
            type="file"
            className="input"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files);
              if (files.length > 4) {
                setError('Maximum 4 images allowed. Please select fewer images.');
                e.target.value = '';
                setImages([]);
                return;
              }
              setError('');
              setImages(files);
            }}
          />
          {images.length > 0 && (
            <p className="list-hint">
              {images.length} image{images.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">What are you swapping?</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. iPhone 15 128GB Space Black"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="input textarea"
            placeholder="Describe condition, what's included, why you're swapping…"
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

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? 'Listing…' : 'List my item'}
        </button>
      </form>
    </div>
  );
}

export default ListItem;
