import { NavLink, Route, Routes } from 'react-router-dom'
import BlueprintsPage from './pages/BlueprintsPage.jsx'
import BlueprintDetailPage from './pages/BlueprintDetailPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFound from './pages/NotFound.jsx'
import BlueprintEditorPage from './pages/BlueprintEditorPage.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'

export default function App() {
  return (
    <div className="container">
      <header>
        <h1>ECI - Laboratorio de Blueprints en React</h1>
        <nav>
          <NavLink to="/" end>
            Blueprints
          </NavLink>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/blueprints/new">Create</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<BlueprintsPage />} />
        <Route path="/blueprints/:author/:name" element={<BlueprintDetailPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/blueprints/new" element={<BlueprintEditorPage />} />
          <Route path="/blueprints/:author/:name/edit" element={<BlueprintDetailPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
