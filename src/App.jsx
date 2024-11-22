import './App.css';

function App() {
  return (
    <>
      <div className="root-grid">
        <div className="header">
          <h1>Header ribbon</h1>
        </div>
        <div className="main-grid">
          <h1>Main viewbox</h1>
        </div>
        <div className="sidebar-grid">
          <div className="sidebar-item">
            <h1>Main viewbox</h1>
          </div>
          <div className="sidebar-item">Sidebar item 1</div>
          <div className="sidebar-item">Sidebar item 2</div>
          <div className="sidebar-item">Sidebar item 3</div>
        </div>
      </div>
    </>
  );
}

export default App;
