import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AddReview from './pages/AddReview';
import AllReviews from './pages/AllReviews';
import EditProfile from './pages/EditProfile';
import ManageReviews from './pages/ManageReviews';
import EditReview from './pages/EditReview';

import ProtectedRoute from './components/ProtectedRoute';

;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/profile/skatsi07" replace />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/:username/reviews" element={<AllReviews />} />


        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/add" element={<AddReview />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/manage-reviews" element={<ManageReviews />} />
          <Route path="/edit/:id" element={<EditReview />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
