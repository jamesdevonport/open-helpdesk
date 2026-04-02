import { h } from "preact";
import { useState } from "preact/hooks";

interface Article {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  categoryId?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface HelpdeskBrowserProps {
  color: string;
  siteUrl?: string;
  categories: Category[];
  articles: Article[];
  onSelectArticle: (slug: string) => void;
  onSearch: (query: string) => void;
  onBack: () => void;
  onClose: () => void;
  showHeader?: boolean;
}

export function HelpdeskBrowser({
  color,
  siteUrl,
  categories,
  articles,
  onSelectArticle,
  onSearch,
  onBack,
  onClose,
  showHeader = true,
}: HelpdeskBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSearch = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setSearchQuery(value);
    setSelectedCategory(null);
    if (value.length > 2) {
      onSearch(value);
    } else if (value.length === 0) {
      onSearch("");
    }
  };

  const isSearching = searchQuery.length > 2;
  const filteredArticles = selectedCategory
    ? articles.filter((a: any) => a.categoryId === selectedCategory)
    : articles;

  const content = (
    <>
      <div class="uls-search">
        <svg class="uls-search-icon" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          class="uls-search-input"
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onInput={handleSearch}
        />
      </div>

      {/* Category pills */}
      {!isSearching && categories.length > 0 && (
        <div class="uls-category-pills">
          <button
            class={`uls-category-pill ${selectedCategory === null ? "active" : ""}`}
            style={selectedCategory === null ? { backgroundColor: color, color: "#fff" } : undefined}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              class={`uls-category-pill ${selectedCategory === cat._id ? "active" : ""}`}
              style={selectedCategory === cat._id ? { backgroundColor: color, color: "#fff" } : undefined}
              onClick={() => setSelectedCategory(cat._id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div class="uls-content">
        <div class="uls-articles">
          {filteredArticles.map((article) => (
            <button
              key={article._id}
              class="uls-article-item"
              onClick={() => onSelectArticle(article.slug)}
            >
              <div>
                <h4>{article.title}</h4>
                {article.description && <p>{article.description}</p>}
              </div>
              <svg viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
          {filteredArticles.length === 0 && (
            <div class="uls-empty-state">
              {isSearching
                ? "No articles found"
                : "No articles available"}
            </div>
          )}
        </div>
      </div>
    </>
  );

  const helpCenterUrl = siteUrl
    ? `${siteUrl.replace(/\/$/, "")}/help`
    : null;

  // When embedded as tab content, just return the content without panel wrapper
  if (!showHeader) {
    return content;
  }

  return (
    <div class="uls-panel uls-panel-expanded">
      <div class="uls-header" style={{ backgroundColor: color }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button class="uls-back" onClick={onBack}>
            <svg viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h2>Help Center</h2>
        </div>
        <button class="uls-header-close" onClick={onClose}>
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {content}

      {helpCenterUrl && (
        <div class="uls-powered">
          <a href={helpCenterUrl} target="_blank" rel="noopener">
            Open full help center
          </a>
        </div>
      )}
    </div>
  );
}
