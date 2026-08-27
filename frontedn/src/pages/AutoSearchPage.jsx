import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

function AutoSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState("Index existing users once, then start typing.");
  const [indexing, setIndexing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleIndexUsers() {
    setIndexing(true);
    setMessage("Indexing all current users into trie...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/trie/indexUsers`, {
        method: "POST"
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not index users");
        return;
      }

      setMessage(`${data.indexedUsers} users indexed into trie`);
    } catch (error) {
      setMessage(`Request failed: ${error.message}`);
    } finally {
      setIndexing(false);
    }
  }

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/users/trie/autoSearch?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Could not search users");
          setSuggestions([]);
          return;
        }

        setSuggestions(data.suggestions || []);
        setMessage(`Showing suggestions for "${query}"`);
      } catch (error) {
        setMessage(`Request failed: ${error.message}`);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div>
      <h1>Trie Auto Search Demo</h1>
      <p>
        First click the indexing button once for existing database users. After that,
        new users created from registration will also be inserted into the trie.
      </p>

      <div>
        <button type="button" onClick={handleIndexUsers} disabled={indexing}>
          {indexing ? "Indexing..." : "Index Existing Users"}
        </button>
        <button type="button" onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>

      <div>
        <label htmlFor="searchUsers">Search users</label>
      </div>
      <input
        id="searchUsers"
        type="text"
        placeholder="Type username or name"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <p>{loading ? "Searching..." : message}</p>

      <ul>
        {suggestions.map((user) => (
          <li key={user._id}>
            <strong>{user.username}</strong> - {user.name}
            {user.email ? ` - ${user.email}` : ""}
            {user.department ? ` - ${user.department}` : ""}
            {user.year ? ` - Year ${user.year}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AutoSearchPage;
