import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import WebNavbar from './components/Navbar/WebNavbar'
import MobileNavbar from './components/Navbar/MobileNavbar'
import Footer from './components/Layout/Footer'
import FloatingButtons from './components/FloatingButtons'
import PrivateRoute from './components/Routes/PrivateRoute'
import ErrorBoundary from './components/Layout/ErrorBoundary'
import ElectricLoader from './components/ElectricLoader'
import AnnouncementBar from './components/AnnouncementBar'
import EntrySplash from './components/EntrySplash'
import { useAuthStore } from './store/authStore'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Services = lazy(() => import('./pages/Services'))
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'))
const Booking = lazy(() => import('./pages/Booking'))
const Cart = lazy(() => import('./pages/Cart'))
const ReceiptPage = lazy(() => import('./pages/ReceiptPage'))
const UserDashboard = lazy(() => import('./pages/UserDashboard'))
const WorkerDashboard = lazy(() => import('./pages/WorkerDashboard'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const WorkerLogin = lazy(() => import('./pages/WorkerLogin'))
const AccountSuspended = lazy(() => import('./pages/AccountSuspended'))
const NotFound = lazy(() => import('./pages/NotFound'))
const StaticPage = lazy(() => import('./pages/StaticPage'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const ManageBookings = lazy(() => import('./admin/ManageBookings'))
const ManageCustomers = lazy(() => import('./admin/ManageCustomers'))
const ManageWorkers = lazy(() => import('./admin/ManageWorkers'))
const ManageServices = lazy(() => import('./admin/ManageServices'))
const ManageCategories = lazy(() => import('./admin/ManageCategories'))
const ManageCoupons = lazy(() => import('./admin/ManageCoupons'))
const ManageBanners = lazy(() => import('./admin/ManageBanners'))
const ManageProducts = lazy(() => import('./admin/ManageProducts'))
const ManageProductCategories = lazy(() => import('./admin/ManageProductCategories'))
const ManageReviews = lazy(() => import('./admin/ManageReviews'))
const ManageSEO = lazy(() => import('./admin/ManageSEO'))
const AITools = lazy(() => import('./admin/AITools'))
const IncomeGraphs = lazy(() => import('./admin/IncomeGraphs'))
const WorkerGraphs = lazy(() => import('./admin/WorkerGraphs'))
const AdminNotifications = lazy(() => import('./admin/AdminNotifications'))
const AdminSettings = lazy(() => import('./admin/AdminSettings'))
const ManageRoles = lazy(() => import('./admin/ManageRoles'))
const WorkerLayout = lazy(() => import('./worker/WorkerLayout'))
const WorkerHistory = lazy(() => import('./worker/WorkerHistory'))
const WorkerNotifications = lazy(() => import('./worker/WorkerNotifications'))

export default function App() {
  const { pathname } = useLocation()
  const initAuthListener = useAuthStore((state) => state.initAuthListener)
  const isPanelRoute = ['/admin', '/worker', '/dashboard', '/customer'].some((path) => pathname.startsWith(path))
  const showPublicChrome = !isPanelRoute
  const [announcementVisible, setAnnouncementVisible] = useState(
    () => sessionStorage.getItem('hes-announcement-hidden') !== 'true',
  )
  const showAnnouncement = showPublicChrome && announcementVisible

  useEffect(() => initAuthListener(), [initAuthListener])

  return (
    <ErrorBoundary>
      <div
        className="min-h-screen bg-[#FAFAFA] text-gray-800 transition-colors dark:bg-gray-950 dark:text-gray-100"
        style={{ '--announcement-offset': showAnnouncement ? '40px' : '0px' }}
      >
        {showPublicChrome && <EntrySplash />}
        {showPublicChrome && (
          <AnnouncementBar
            visible={showAnnouncement}
            onClose={() => {
              sessionStorage.setItem('hes-announcement-hidden', 'true')
              setAnnouncementVisible(false)
            }}
          />
        )}
        {showPublicChrome && <WebNavbar />}
        {showPublicChrome && <MobileNavbar />}
        <div className={showPublicChrome ? `${showAnnouncement ? 'pt-[104px]' : 'pt-16'} pb-24 transition-[padding] duration-300 lg:pb-0` : ''}>
          <Suspense fallback={<ElectricLoader />}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/receipt/:bookingId" element={<ReceiptPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<StaticPage type="faq" />} />
            <Route path="/blog" element={<StaticPage type="blog" />} />
            <Route path="/privacy-policy" element={<StaticPage type="privacy" />} />
            <Route path="/terms" element={<StaticPage type="terms" />} />
            <Route path="/payment-success" element={<StaticPage type="success" />} />
            <Route path="/payment-failed" element={<StaticPage type="failed" />} />
          <Route
            path="/booking"
            element={
              <PrivateRoute roles={['user', 'admin']}>
                <Booking />
              </PrivateRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <PrivateRoute roles={['user', 'admin']}>
                <Booking />
              </PrivateRoute>
            }
          />
          <Route
            path="/book/:serviceId"
            element={
              <PrivateRoute roles={['user', 'admin']}>
                <Booking />
              </PrivateRoute>
            }
          />
          <Route
            path="/booking/success"
            element={
              <PrivateRoute roles={['user', 'admin']}>
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute roles={['user', 'admin']}>
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/bookings"
            element={
              <PrivateRoute roles={['user', 'admin']}>
                <UserDashboard initialTab="bookings" />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/receipts"
            element={
              <PrivateRoute roles={['user', 'admin']}>
                <UserDashboard initialTab="receipts" />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/coupons"
            element={
              <PrivateRoute roles={['user', 'admin']}>
                <UserDashboard initialTab="coupons" />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <PrivateRoute roles={['user', 'admin']}>
                <UserDashboard initialTab="profile" />
              </PrivateRoute>
            }
          />
          <Route
            path="/customer"
            element={
              <PrivateRoute roles={['user', 'customer', 'admin']}>
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/customer/bookings"
            element={
              <PrivateRoute roles={['user', 'customer', 'admin']}>
                <UserDashboard initialTab="bookings" />
              </PrivateRoute>
            }
          />
          <Route
            path="/customer/coupons"
            element={
              <PrivateRoute roles={['user', 'customer', 'admin']}>
                <UserDashboard initialTab="coupons" />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <PrivateRoute roles={['admin', 'superadmin']}>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="bookings" element={<ManageBookings />} />
            <Route path="customers" element={<ManageCustomers />} />
            <Route path="workers" element={<ManageWorkers />} />
            <Route path="services" element={<ManageServices />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="coupons" element={<ManageCoupons />} />
            <Route path="products" element={<ManageProducts />} />
            <Route path="product-categories" element={<ManageProductCategories />} />
            <Route path="reviews" element={<ManageReviews />} />
            <Route path="seo" element={<ManageSEO />} />
            <Route path="ai-tools" element={<AITools />} />
            <Route path="banners" element={<ManageBanners />} />
            <Route path="splash" element={<ManageBanners initialSection="splash" />} />
            <Route path="income" element={<IncomeGraphs />} />
            <Route path="worker-graphs" element={<WorkerGraphs />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="roles" element={<ManageRoles />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="settings/hero" element={<AdminSettings initialSection="hero" />} />
          </Route>

          <Route
            path="/worker/*"
            element={
              <PrivateRoute roles={['worker', 'admin']}>
                <WorkerLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<WorkerDashboard />} />
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="jobs" element={<WorkerDashboard />} />
            <Route path="history" element={<WorkerHistory />} />
            <Route path="earnings" element={<WorkerHistory />} />
            <Route path="notifications" element={<WorkerNotifications />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/worker/login" element={<WorkerLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account-suspended" element={<AccountSuspended />} />
          <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          {showPublicChrome && <Footer />}
        </div>
        {showPublicChrome && <FloatingButtons />}
      </div>
    </ErrorBoundary>
  )
}
