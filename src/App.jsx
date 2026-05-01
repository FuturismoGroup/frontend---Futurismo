import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Stores
import useAuthStore from './stores/authStore';
import useNotificationsStore from './stores/notificationsStore';

// Contexts
import { LayoutProvider } from './contexts/LayoutContext';
import { ConfigProvider } from './contexts/ConfigContext';

// Componentes
import AppLayout from './components/layout/AppLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy loading de páginas
const LoginRegister = lazy(() => import('./pages/LoginRegister'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const Reservations = lazy(() => import('./pages/Reservations'));
const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));
const Chat = lazy(() => import('./pages/Chat'));
const Users = lazy(() => import('./pages/Users'));
const Agenda = lazy(() => import('./pages/Agenda'));
const TourAssignments = lazy(() => import('./pages/TourAssignments'));
const Providers = lazy(() => import('./pages/Providers'));
const EmergencyProtocols = lazy(() => import('./pages/EmergencyProtocols'));
const GuidesManagement = lazy(() => import('./pages/GuidesManagement'));
const ClientsManagement = lazy(() => import('./pages/ClientsManagement'));
const DriversManagement = lazy(() => import('./pages/DriversManagement'));
const VehiclesManagement = lazy(() => import('./pages/VehiclesManagement'));
const ServicesManagement = lazy(() => import('./pages/ServicesManagement'));
const AgencyReports = lazy(() => import('./pages/AgencyReports'));
const AgencyPoints = lazy(() => import('./pages/AgencyPoints'));
const AdminEmergency = lazy(() => import('./pages/AdminEmergency'));
const AdminReservations = lazy(() => import('./pages/AdminReservations'));
const ReservationManagement = lazy(() => import('./pages/admin/ReservationManagement'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const FinancialDashboard = lazy(() => import('./pages/guide/FinancialDashboard'));
const GuideTourView = lazy(() => import('./pages/guide/GuideTourView'));
const GuideDashboard = lazy(() => import('./pages/guide/GuideDashboard'));

// Marketplace pages
const GuidesMarketplace = lazy(() => import('./pages/marketplace/GuidesMarketplace'));
const GuideMarketplaceProfile = lazy(() => import('./pages/marketplace/GuideMarketplaceProfile'));
const ServiceRequestForm = lazy(() => import('./pages/marketplace/ServiceRequestForm'));
const ServiceRequestDetail = lazy(() => import('./pages/marketplace/ServiceRequestDetail'));
const ServiceReview = lazy(() => import('./pages/marketplace/ServiceReview'));
const AgencyMarketplaceDashboard = lazy(() => import('./pages/marketplace/AgencyMarketplaceDashboard'));
const GuideMarketplaceDashboard = lazy(() => import('./pages/marketplace/GuideMarketplaceDashboard'));
const GuideServicePricing = lazy(() => import('./pages/marketplace/GuideServicePricing'));
const GuideAvailabilityManager = lazy(() => import('./pages/marketplace/GuideAvailabilityManager'));

// Rewards pages
const RewardsManagement = lazy(() => import('./pages/admin/RewardsManagement'));
const RewardsStore = lazy(() => import('./pages/agency/RewardsStore'));
const TestRewards = lazy(() => import('./pages/TestRewards'));

// Terms pages
const TermsManagement = lazy(() => import('./pages/admin/TermsManagement'));

// WebSocket service
import webSocketService from './services/websocket';

function App() {
  // ✅ Usar selectores optimizados para evitar re-renders innecesarios
  // NOTA: initialize y logout se acceden via getState() para evitar re-renders
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  // Listener para sesión expirada - SIN window.location.href para evitar full reload
  // El ProtectedRoute ya maneja la redirección via <Navigate to="/login">
  useEffect(() => {
    const handleSessionExpired = () => {
      useAuthStore.getState().logout();
      // NO usar window.location.href - causa full page reload
    };

    window.addEventListener('auth:session:expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session:expired', handleSessionExpired);
    };
  }, []); // ✅ Sin dependencias - el listener es estable

  // Inicializar la aplicación - se ejecuta UNA SOLA VEZ
  useEffect(() => {
    try {
      // MIGRACIÓN: Convertir claves antiguas a nuevas
      const migrateStorageKeys = () => {
        // Migrar localStorage
        const oldTokenLocal = localStorage.getItem('futurismo_authToken');
        const oldUserLocal = localStorage.getItem('futurismo_authUser');

        if (oldTokenLocal) {
          localStorage.setItem('futurismo_auth_token', oldTokenLocal);
          localStorage.removeItem('futurismo_authToken');
        }

        if (oldUserLocal) {
          localStorage.setItem('futurismo_auth_user', oldUserLocal);
          localStorage.removeItem('futurismo_authUser');
        }

        // Migrar sessionStorage
        const oldTokenSession = sessionStorage.getItem('futurismo_authToken');
        const oldUserSession = sessionStorage.getItem('futurismo_authUser');

        if (oldTokenSession) {
          sessionStorage.setItem('futurismo_auth_token', oldTokenSession);
          sessionStorage.removeItem('futurismo_authToken');
        }

        if (oldUserSession) {
          sessionStorage.setItem('futurismo_auth_user', oldUserSession);
          sessionStorage.removeItem('futurismo_authUser');
        }
      };

      // Ejecutar migración antes de inicializar
      migrateStorageKeys();

      // Usar getState() para evitar dependencia
      useAuthStore.getState().initialize();
    } catch (error) {
      // Solo limpiar claves de auth, no todo localStorage
      const authKeys = ['futurismo_auth_token', 'futurismo_auth_user'];
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    }
  }, []); // ✅ Sin dependencias - solo se ejecuta una vez al montar

  // Cargar notificaciones cuando el usuario se autentique
  // ✅ Se ejecuta solo cuando cambia isAuthenticated o user.id
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Llamar al método del store directamente usando getState para evitar dependencias
      useNotificationsStore.getState().fetchNotifications(user.id);
    }
  }, [isAuthenticated, user?.id]); // ✅ Sin incluir funciones del store

  // Conectar WebSocket cuando se autentique
  useEffect(() => {
    if (isAuthenticated && token) {
      webSocketService.connect(token);

      // Listener para nuevas notificaciones
      const unsubscribeNotification = webSocketService.on('notification:new', (data) => {
        if (data.type === 'chat_message') {
          // Mensajes de chat: agregar al estado local con actionUrl para navegación
          useNotificationsStore.setState((state) => ({
            unreadCount: state.unreadCount + 1,
            notifications: [{
              id: data.id,
              type: 'info',
              title: data.title,
              message: data.message,
              category: 'chat',
              actionUrl: '/chat',
              read: false,
              createdAt: data.createdAt || new Date().toISOString()
            }, ...state.notifications]
          }));

          // Reproducir sonido si está habilitado
          const { soundEnabled } = useNotificationsStore.getState();
          if (soundEnabled) {
            useNotificationsStore.getState().playNotificationSound();
          }
        } else {
          useNotificationsStore.getState().addNotification(user?.id, data);
        }
      });

      // Listener para actualizacion de contador de no leidos en chats
      const unsubscribeUnread = webSocketService.on('unread:update', () => {
        // Los componentes de chat (useChatList) escuchan este evento directamente
      });

      return () => {
        unsubscribeNotification();
        unsubscribeUnread();
        webSocketService.disconnect();
      };
    }
  }, [isAuthenticated, token, user?.id]);

  return (
    <ConfigProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
          {/* Ruta de login */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginRegister />
            } 
          />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LayoutProvider>
                  <AppLayout />
                </LayoutProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route 
              path="reservations" 
              element={
                <ProtectedRoute allowedRoles={['agency', 'admin']}>
                  <Reservations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/reservations" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ReservationManagement />
                </ProtectedRoute>
              } 
            />
            <Route path="history" element={<History />} />
            <Route path="chat" element={<Chat />} />
            <Route path="profile" element={<Profile />} />
            <Route 
              path="users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="agenda" 
              element={
                <ProtectedRoute allowedRoles={['guide', 'admin']}>
                  <Agenda />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="assignments" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TourAssignments />
                </ProtectedRoute>
              } 
            />
            <Route
              path="providers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'guide']}>
                  <Providers />
                </ProtectedRoute>
              }
            />
            <Route 
              path="emergency" 
              element={
                <ProtectedRoute allowedRoles={['guide', 'admin']}>
                  <EmergencyProtocols />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="guides" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <GuidesManagement />
                </ProtectedRoute>
              } 
            />
            <Route
              path="clients"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ClientsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="drivers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DriversManagement />
                </ProtectedRoute>
              }
            />
            <Route 
              path="vehicles" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <VehiclesManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="services" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'agency']}>
                  <ServicesManagement />
                </ProtectedRoute>
              } 
            />
<Route 
              path="agency/reports" 
              element={
                <ProtectedRoute allowedRoles={['agency', 'admin']}>
                  <AgencyReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="agency/points" 
              element={
                <ProtectedRoute allowedRoles={['agency', 'admin']}>
                  <AgencyPoints />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/reports" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/emergency" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminEmergency />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/reservations-list" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReservations />
                </ProtectedRoute>
              } 
            />
            <Route
              path="admin/rewards"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <RewardsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/terms"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TermsManagement />
                </ProtectedRoute>
              }
            />
            <Route 
              path="agency/rewards" 
              element={
                <ProtectedRoute allowedRoles={['agency']}>
                  <RewardsStore />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="test-rewards" 
              element={<TestRewards />}
            />
            
            {/* RUTAS DEMO CON BYPASS DE AUTENTICACIÓN */}
            <Route path="demo-test" element={<TestRewards />} />
            
            <Route
              path="guide/dashboard"
              element={
                <ProtectedRoute allowedRoles={['guide']}>
                  <GuideDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="guide/finances"
              element={
                <ProtectedRoute allowedRoles={['guide']} requireGuideType="freelance">
                  <FinancialDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="guide/tour/:tourId"
              element={
                <ProtectedRoute allowedRoles={['guide']}>
                  <GuideTourView />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas del Marketplace */}
            <Route path="marketplace">
              <Route 
                index 
                element={
                  <ProtectedRoute allowedRoles={['agency', 'admin']}>
                    <GuidesMarketplace />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="guide/:guideId" 
                element={
                  <ProtectedRoute allowedRoles={['agency', 'admin']}>
                    <GuideMarketplaceProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="book/:guideId" 
                element={
                  <ProtectedRoute allowedRoles={['agency', 'admin']}>
                    <ServiceRequestForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="requests" 
                element={
                  <ProtectedRoute allowedRoles={['agency', 'admin']}>
                    <AgencyMarketplaceDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="requests/:requestId" 
                element={
                  <ProtectedRoute allowedRoles={['agency', 'admin', 'guide']}>
                    <ServiceRequestDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="review/:requestId" 
                element={
                  <ProtectedRoute allowedRoles={['agency', 'admin']}>
                    <ServiceReview />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="guide-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['guide']} requireGuideType="freelance">
                    <GuideMarketplaceDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="guide-rate"
                element={
                  <ProtectedRoute allowedRoles={['guide', 'admin']} requireGuideType="freelance">
                    <GuideServicePricing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="guide-availability"
                element={
                  <ProtectedRoute allowedRoles={['guide']} requireGuideType="freelance">
                    <GuideAvailabilityManager />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>

          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
      </Router>
    </ConfigProvider>
  );
}

export default App;