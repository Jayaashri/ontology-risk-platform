import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

function App() {
  const [activePage, setActivePage] =
    useState("analyzer");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] =
    useState("mock");

  const [ontology, setOntology] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [apiConnected, setApiConnected] =
    useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    await Promise.all([
      checkAPI(),
      loadProviders(),
      loadHistory(),
      loadOntology()
    ]);
  }

  async function checkAPI() {
    try {
      await axios.get(`${API_URL}/`);
      setApiConnected(true);
    } catch {
      setApiConnected(false);
    }
  }

  async function loadProviders() {
    try {
      const response = await axios.get(
        `${API_URL}/providers`
      );

      setProviders(response.data.providers);
    } catch (error) {
      console.error("Provider error:", error);
    }
  }

  async function loadHistory() {
    try {
      const response = await axios.get(
        `${API_URL}/analyses`
      );

      setHistory(response.data);
    } catch (error) {
      console.error("History error:", error);
    }
  }

  async function loadOntology() {
    try {
      const response = await axios.get(
        `${API_URL}/test-ontology`
      );

      setOntology(response.data);
    } catch (error) {
      console.error("Ontology error:", error);
    }
  }

  function toggleTheme() {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    setFile(selectedFile);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(
      URL.createObjectURL(selectedFile)
    );

    setResult(null);
    setError("");
  }

  async function analyzeImage() {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "provider",
        selectedProvider
      );

      const response = await axios.post(
        `${API_URL}/analyze`,
        formData
      );

      setResult(response.data);

      await loadHistory();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
        "Image analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openAnalysis(id) {
    try {
      const response = await axios.get(
        `${API_URL}/analyses/${id}`
      );

      setResult({
        analysis_id: response.data.id,
        filename: response.data.filename,
        provider: response.data.provider,
        created_at: response.data.created_at,
        ttl: response.data.ttl,
        risks: response.data.risks
      });

      setActivePage("analyzer");
      setError("");
    } catch (error) {
      console.error(error);

      setError("Could not load analysis.");
    }
  }

  function providerName(providerId) {
    const provider = providers.find(
      (item) => item.id === providerId
    );

    if (provider) {
      return provider.name;
    }

    if (providerId === "gemini") return "Gemini";
    if (providerId === "openai") return "OpenAI";
    if (providerId === "anthropic") return "Claude";
    if (providerId === "mock") return "Demo / Mock";

    return providerId || "Unknown";
  }

  function formatRiskName(name) {
    if (!name) return "Unknown Risk";

    return name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
      .trim();
  }

  function severityInfo(value) {
    if (value >= 0.8) {
      return {
        label: "HIGH",
        className: "high"
      };
    }

    if (value >= 0.5) {
      return {
        label: "MEDIUM",
        className: "medium"
      };
    }

    return {
      label: "LOW",
      className: "low"
    };
  }

  function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );
  }

  function openDocs() {
    window.open(
      `${API_URL}/docs`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copyRDF() {
    if (!result?.ttl) return;

    await navigator.clipboard.writeText(
      result.ttl
    );
  }

  function AnalyzerPage() {
    return (
      <div className="workspace">

        <aside className="analysis-sidebar">

          <div className="sidebar-section">
            <p className="section-label">
              ANALYSIS
            </p>

            <label className="field-label">
              Model
            </label>

            <select
              className="model-select"
              value={selectedProvider}
              onChange={(event) =>
                setSelectedProvider(
                  event.target.value
                )
              }
            >
              {providers.map((provider) => (
                <option
                  key={provider.id}
                  value={provider.id}
                  disabled={!provider.available}
                >
                  {provider.name}
                  {provider.available
                    ? ""
                    : " — API key required"}
                </option>
              ))}
            </select>

            <p className="field-help">
              {selectedProvider === "mock"
                ? "Demo mode uses sample risk data."
                : `Analyze using ${providerName(
                    selectedProvider
                  )} with ontology grounding.`}
            </p>
          </div>

          <div className="sidebar-section">
            <label className="field-label">
              Upload Driving Scene
            </label>

            <label className="dropzone">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
              />

              <span className="upload-icon">
                ↑
              </span>

              <strong>
                Choose a driving scene
              </strong>

              <span>
                PNG, JPG or JPEG
              </span>
            </label>

            {preview && (
              <div className="selected-image">
                <img
                  src={preview}
                  alt="Selected driving scene"
                />

                <div className="selected-file">
                  <span className="file-name">
                    {file?.name}
                  </span>
                </div>
              </div>
            )}

            <button
              className="primary-button"
              onClick={analyzeImage}
              disabled={loading}
            >
              {loading
                ? "Analyzing..."
                : "Analyze Scene"}
            </button>

            {error && (
              <div className="error">
                {error}
              </div>
            )}
          </div>

          <div className="recent-section">

            <div className="recent-heading">
              <span>RECENT ANALYSES</span>

              <button
                onClick={() =>
                  setActivePage("analyses")
                }
              >
                View all →
              </button>
            </div>

            <div className="recent-list">
              {history
                .slice(0, 4)
                .map((analysis) => (
                  <button
                    className="recent-item"
                    key={analysis.id}
                    onClick={() =>
                      openAnalysis(analysis.id)
                    }
                  >
                    <div>
                      <strong>
                        {analysis.filename}
                      </strong>

                      <span>
                        {providerName(
                          analysis.provider
                        )}{" "}
                        ·{" "}
                        {analysis.risk_count ??
                          analysis.risks?.length ??
                          0}{" "}
                        risks
                      </span>
                    </div>

                    <span className="recent-date">
                      {formatDate(
                        analysis.created_at
                      )}
                    </span>
                  </button>
                ))}
            </div>

          </div>

        </aside>

        <section className="main-content">

          <div className="page-heading">
            <div>
              <h2>Analysis Results</h2>

              <p>
                Ontology-grounded autonomous
                driving risk detection
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() =>
                setActivePage("analyses")
              }
            >
              View All Analyses
            </button>
          </div>

          {!result ? (
            <div className="empty-results">
              <div>
                <h3>
                  No analysis selected
                </h3>

                <p>
                  Upload a driving scene and
                  select an AI model to begin.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="summary-strip">

                <div className="summary-item">
                  <span>ANALYSIS</span>
                  <strong>
                    #{result.analysis_id}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>MODEL</span>
                  <strong>
                    {providerName(
                      result.provider
                    )}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>FILE</span>
                  <strong className="mono">
                    {result.filename}
                  </strong>
                </div>

                <div className="summary-item">
                  <span>DETECTED RISKS</span>
                  <strong>
                    {result.risks?.length || 0}
                  </strong>
                </div>

              </div>

              <div className="results-heading">
                <h3>
                  Detected Risks
                  <span>
                    {result.risks?.length || 0}
                  </span>
                </h3>
              </div>

              <div className="risk-list">

                {result.risks?.map(
                  (risk, index) => {
                    const severity =
                      Number(risk.severity) || 0;

                    const severityData =
                      severityInfo(severity);

                    return (
                      <article
                        className="risk-row"
                        key={`${risk.risk_id}-${index}`}
                      >
                        <div className="risk-number">
                          {index + 1}
                        </div>

                        <div className="risk-content">
                          <div className="risk-title-row">
                            <div>
                              <span className="risk-id mono">
                                {risk.risk_id}
                              </span>

                              <h4>
                                {formatRiskName(
                                  risk.risk_type
                                )}
                              </h4>
                            </div>

                            <div className="severity">
                              <strong>
                                {Math.round(
                                  severity * 100
                                )}
                                %
                              </strong>

                              <span
                                className={
                                  `severity-badge ${severityData.className}`
                                }
                              >
                                {
                                  severityData.label
                                }
                              </span>
                            </div>
                          </div>

                          <p>
                            {risk.description}
                          </p>
                        </div>
                      </article>
                    );
                  }
                )}

              </div>

              <details className="rdf-panel">
                <summary>
                  Generated RDF / Turtle
                </summary>

                <div className="rdf-content">
                  <button
                    className="copy-button"
                    onClick={copyRDF}
                  >
                    Copy
                  </button>

                  <pre>
                    {result.ttl}
                  </pre>
                </div>
              </details>
            </>
          )}

        </section>
      </div>
    );
  }

  function AnalysesPage() {
    return (
      <section className="standalone-page">

        <div className="page-heading">
          <div>
            <h2>Analysis History</h2>
            <p>
              Previously analyzed driving
              scenes
            </p>
          </div>

          <span className="record-count">
            {history.length} analyses
          </span>
        </div>

        <div className="table-card">

          <div className="analysis-table table-header">
            <span>ID</span>
            <span>FILE</span>
            <span>MODEL</span>
            <span>RISKS</span>
            <span>DATE</span>
          </div>

          {history.map((analysis) => (
            <button
              key={analysis.id}
              className="analysis-table table-row"
              onClick={() =>
                openAnalysis(analysis.id)
              }
            >
              <span>
                #{analysis.id}
              </span>

              <span className="mono">
                {analysis.filename}
              </span>

              <span>
                {providerName(
                  analysis.provider
                )}
              </span>

              <span>
                {analysis.risk_count ??
                  analysis.risks?.length ??
                  0}
              </span>

              <span>
                {formatDate(
                  analysis.created_at
                )}
              </span>
            </button>
          ))}

        </div>
      </section>
    );
  }

  function OntologyPage() {
    return (
      <section className="standalone-page">

        <div className="page-heading">
          <div>
            <h2>PRO2 Ontology</h2>

            <p>
              Semantic model used to ground
              autonomous-driving risk analysis
            </p>
          </div>
        </div>

        {!ontology ? (
          <div className="empty-results">
            Loading ontology...
          </div>
        ) : (
          <>
            <div className="ontology-metrics">

              <div>
                <span>TRIPLES</span>
                <strong>
                  {ontology.triple_count}
                </strong>
              </div>

              <div>
                <span>CLASSES</span>
                <strong>
                  {ontology.class_count}
                </strong>
              </div>

              <div>
                <span>RELATIONSHIPS</span>
                <strong>
                  {ontology.relationship_count}
                </strong>
              </div>

              <div>
                <span>FORMAT</span>
                <strong>RDF / OWL</strong>
              </div>

            </div>

            <div className="ontology-grid">

              <div className="ontology-card">
                <h3>
                  Ontology Classes
                </h3>

                <div className="tag-list">
                  {ontology.classes?.map(
                    (item) => (
                      <span key={item}>
                        {formatRiskName(item)}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="ontology-card">
                <h3>
                  Relationships
                </h3>

                <div className="tag-list">
                  {ontology.relationships?.map(
                    (item) => (
                      <span
                        key={item}
                        className="mono"
                      >
                        {item}
                      </span>
                    )
                  )}
                </div>
              </div>

            </div>
          </>
        )}

      </section>
    );
  }

  return (
    <div className="app">

      <header className="topbar">

        <button
          className="brand"
          onClick={() =>
            setActivePage("analyzer")
          }
        >
          <div className="brand-icon">
            OR
          </div>

          <div>
            <strong>
              Ontology Risk Analyzer
            </strong>

            <span>
              Autonomous-driving risk analysis
            </span>
          </div>
        </button>

        <nav>
          <button
            className={
              activePage === "analyzer"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("analyzer")
            }
          >
            Analyzer
          </button>

          <button
            className={
              activePage === "analyses"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("analyses")
            }
          >
            Analyses
          </button>

          <button
            className={
              activePage === "ontology"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("ontology")
            }
          >
            Ontology
          </button>

          <button onClick={openDocs}>
            API Docs ↗
          </button>
        </nav>

        <div className="topbar-actions">

          <div
            className={
              apiConnected
                ? "status connected"
                : "status offline"
            }
          >
            <span />
            {apiConnected
              ? "Connected"
              : "API Offline"}
          </div>

          <button
            className="theme-button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light"
              ? "☾"
              : "☀"}
          </button>

        </div>

      </header>

      {activePage === "analyzer" &&
        <AnalyzerPage />}

      {activePage === "analyses" &&
        <AnalysesPage />}

      {activePage === "ontology" &&
        <OntologyPage />}

    </div>
  );
}

export default App;