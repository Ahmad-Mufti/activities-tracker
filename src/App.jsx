import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { SemesterProvider } from './context/SemesterContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Jadwal from './pages/Jadwal'
import Tugas from './pages/Tugas'
import Proyek from './pages/Proyek'
import Kebiasaan from './pages/Kebiasaan'
import Rohani from './pages/Rohani'
import Inbox from './pages/Inbox'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <SemesterProvider>
              <Layout />
            </SemesterProvider>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/jadwal" element={<Jadwal />} />
          <Route path="/tugas" element={<Tugas />} />
          <Route path="/proyek" element={<Proyek />} />
          <Route path="/kebiasaan" element={<Kebiasaan />} />
          <Route path="/rohani" element={<Rohani />} />
          <Route path="/inbox" element={<Inbox />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
