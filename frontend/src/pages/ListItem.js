import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItem } from '../services/api';
import './ListItem.css';

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

  const categories = [
    { value: 'electronics', label: '🔌 Electronics' },
    { value: 'phones', label: '📱 Phones' },
    { value: 'computers', label: '💻 Computers' },
    { value: 'cameras', label: '📷 Cameras' },
    { value: 'fashion', label: '👕 Fashion' },
    { value: 'home', label: '🏠 Home' },
    { value: 'sports', label: '⚽ Sports' },
    { value: 'books', label: '📚 Books' },
    { value: 'games', label: '🎮 Games' },
    { value: 'other', label: '📦 Other' },
  ];

  const conditions = [
    { value: 'new', label: '✨ New - never used' },
    { value: 'like_new', label: '🌿 Like new - barely used' },
    { value: 'good', label: '👍 Good - normal wear' },
    { value: 'fair', label: '🔧 Fair - visible wear' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !category || !condition) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await createItem({ title, description, category, condition });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="page">
        <div className="success-state">
          <span className="success-mascot">🐢</span>
          <h2>Listed! 🌱</h2>
          <p className="text-secondary">
            Turt is happy — your item is now available for swapping!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2 className="mb-8">List an item 🌿</h2>
      <p className="text-secondary mb-16">
        Give your stuff a second life — someone might love it!
      </p>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit}>
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
            <p className="text-small mt-8">
              {images.length} image{images.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">What are you swapping? *</label>
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
            placeholder="Describe your item — condition, what's included, why you're swapping..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category *</label>
          <select
            className="input select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Condition *</label>
          <select
            className="input select"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="">Select condition</option>
            {conditions.map((cond) => (
              <option key={cond.value} value={cond.value}>{cond.label}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Listing...' : '🌱 List my item'}
        </button>
      </form>
    </div>
  );
}

export default ListItem;
