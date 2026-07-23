import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { Layout } from '../components/layout/Layout';
import { AuthGuard } from '../features/auth/components/guards/AuthGuard';
import { GuestRouteGuard } from '../features/auth/components/guards/GuestRouteGuard';
import { RoleGuard } from '../features/auth/components/guards/RoleGuard';

const HomePage = lazy(() =>
  import('../features/home/components/HomePage').then((m) => ({ default: m.HomePage })),
);
const ProtectedDemoPage = lazy(() =>
  import('../features/home/components/ProtectedDemoPage').then((m) => ({
    default: m.ProtectedDemoPage,
  })),
);
const AuthLayout = lazy(() =>
  import('../features/auth/components/AuthLayout/AuthLayout').then((m) => ({
    default: m.AuthLayout,
  })),
);
const RegisterPage = lazy(() =>
  import('../features/auth/components/RegisterPage/RegisterPage').then((m) => ({
    default: m.RegisterPage,
  })),
);
const LoginPage = lazy(() =>
  import('../features/auth/components/LoginPage/LoginPage').then((m) => ({
    default: m.LoginPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import('../features/auth/components/ForgotPasswordPage/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const VerifyEmailPage = lazy(() =>
  import('../features/auth/components/VerifyEmailPage/VerifyEmailPage').then((m) => ({
    default: m.VerifyEmailPage,
  })),
);
const SearchPage = lazy(() =>
  import('../features/listings/pages/SearchPage/SearchPage').then((m) => ({
    default: m.SearchPage,
  })),
);
const ListingDetailPage = lazy(() =>
  import('../features/listings/pages/ListingDetailPage/ListingDetailPage').then((m) => ({
    default: m.ListingDetailPage,
  })),
);
const ComparePage = lazy(() =>
  import('../features/compare/pages/ComparePage/ComparePage').then((m) => ({
    default: m.ComparePage,
  })),
);
const HelpPage = lazy(() =>
  import('../features/help/pages/HelpPage/HelpPage').then((m) => ({
    default: m.HelpPage,
  })),
);
const FavoritesPage = lazy(() =>
  import('../features/favorites/pages/FavoritesPage/FavoritesPage').then((m) => ({
    default: m.FavoritesPage,
  })),
);
const ProfilePage = lazy(() =>
  import('../features/profile/pages/ProfilePage/ProfilePage').then((m) => ({
    default: m.ProfilePage,
  })),
);
const NotificationsPage = lazy(() =>
  import('../features/notifications/pages/NotificationsPage/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
);
const OwnerDashboardPage = lazy(() =>
  import('../features/dashboard/pages/OwnerDashboardPage/OwnerDashboardPage').then((m) => ({
    default: m.OwnerDashboardPage,
  })),
);
const ListingEditorPage = lazy(() =>
  import('../features/dashboard/pages/ListingEditorPage/ListingEditorPage').then((m) => ({
    default: m.ListingEditorPage,
  })),
);
const OwnerListingsPage = lazy(() =>
  import('../features/dashboard/pages/OwnerListingsPage/OwnerListingsPage').then((m) => ({
    default: m.OwnerListingsPage,
  })),
);
const OwnerReviewsPage = lazy(() =>
  import('../features/reviews/pages/OwnerReviewsPage/OwnerReviewsPage').then((m) => ({
    default: m.OwnerReviewsPage,
  })),
);
const PricingPlansPage = lazy(() =>
  import('../features/payments/pages/PricingPlansPage/PricingPlansPage').then((m) => ({
    default: m.PricingPlansPage,
  })),
);
const PaymentCheckoutPage = lazy(() =>
  import('../features/payments/pages/PaymentCheckoutPage/PaymentCheckoutPage').then((m) => ({
    default: m.PaymentCheckoutPage,
  })),
);
const VenueCheckoutPage = lazy(() =>
  import('../features/subscriptions/pages/VenueCheckoutPage/VenueCheckoutPage').then((m) => ({
    default: m.VenueCheckoutPage,
  })),
);
const MembershipsPage = lazy(() =>
  import('../features/subscriptions/pages/MembershipsPage/MembershipsPage').then((m) => ({
    default: m.MembershipsPage,
  })),
);
const OwnerCheckInPage = lazy(() =>
  import('../features/subscriptions/pages/OwnerCheckInPage/OwnerCheckInPage').then((m) => ({
    default: m.OwnerCheckInPage,
  })),
);
const AdminOverviewPage = lazy(() =>
  import('../features/admin/pages/AdminOverviewPage/AdminOverviewPage').then((m) => ({
    default: m.AdminOverviewPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import('../features/admin/pages/AdminUsersPage/AdminUsersPage').then((m) => ({
    default: m.AdminUsersPage,
  })),
);
const AdminLayout = lazy(() =>
  import('../features/admin/components/AdminLayout/AdminLayout').then((m) => ({
    default: m.AdminLayout,
  })),
);
const AdminListingsPage = lazy(() =>
  import('../features/admin/pages/AdminListingsPage/AdminListingsPage').then((m) => ({
    default: m.AdminListingsPage,
  })),
);
const AdminReviewsPage = lazy(() =>
  import('../features/admin/pages/AdminReviewsPage/AdminReviewsPage').then((m) => ({
    default: m.AdminReviewsPage,
  })),
);
const AdminCategoriesPage = lazy(() =>
  import('../features/admin/pages/AdminCategoriesPage/AdminCategoriesPage').then((m) => ({
    default: m.AdminCategoriesPage,
  })),
);
const AdminSubscriptionsPage = lazy(() =>
  import('../features/admin/pages/AdminSubscriptionsPage/AdminSubscriptionsPage').then((m) => ({
    default: m.AdminSubscriptionsPage,
  })),
);
const AdminPaymentsPage = lazy(() =>
  import('../features/admin/pages/AdminPaymentsPage/AdminPaymentsPage').then((m) => ({
    default: m.AdminPaymentsPage,
  })),
);
const AdminContentPage = lazy(() =>
  import('../features/admin/pages/AdminContentPage/AdminContentPage').then((m) => ({
    default: m.AdminContentPage,
  })),
);
const AdminSettingsPage = lazy(() =>
  import('../features/admin/pages/AdminSettingsPage/AdminSettingsPage').then((m) => ({
    default: m.AdminSettingsPage,
  })),
);
const AdminAuditPage = lazy(() =>
  import('../features/admin/pages/AdminAuditPage/AdminAuditPage').then((m) => ({
    default: m.AdminAuditPage,
  })),
);
const AccountLayout = lazy(() =>
  import('../features/account/components/AccountLayout/AccountLayout').then((m) => ({
    default: m.AccountLayout,
  })),
);
const OwnerLayout = lazy(() =>
  import('../features/dashboard/components/OwnerLayout/OwnerLayout').then((m) => ({
    default: m.OwnerLayout,
  })),
);

function RouteFallback() {
  const { t } = useTranslation('common');
  return <p>{t('loading')}</p>;
}

function AdminDemoContent() {
  const { t } = useTranslation('common');
  return <p data-testid="admin-demo-ok">{t('adminPanel')}</p>;
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route
            path="login"
            element={
              <GuestRouteGuard>
                <LoginPage />
              </GuestRouteGuard>
            }
          />
          <Route
            path="register"
            element={
              <GuestRouteGuard>
                <RegisterPage />
              </GuestRouteGuard>
            }
          />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="listings" element={<SearchPage />} />
          <Route path="listings/:slug" element={<ListingDetailPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="help" element={<HelpPage />} />
          <Route
            path="listings/:slug/checkout"
            element={
              <AuthGuard>
                <VenueCheckoutPage />
              </AuthGuard>
            }
          />
          <Route
            path="account"
            element={
              <AuthGuard>
                <AccountLayout />
              </AuthGuard>
            }
          >
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="memberships" element={<MembershipsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route
              path="demo"
              element={<ProtectedDemoPage />}
            />
          </Route>
          <Route
            path="admin"
            element={
              <AuthGuard>
                <RoleGuard allow={['admin', 'super_admin']}>
                  <AdminLayout />
                </RoleGuard>
              </AuthGuard>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="listings" element={<AdminListingsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="content" element={<AdminContentPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
            <Route path="demo" element={<AdminDemoContent />} />
          </Route>
          <Route
            path="owner"
            element={
              <AuthGuard>
                <OwnerLayout />
              </AuthGuard>
            }
          >
            <Route
              index
              element={
                <RoleGuard allow={['gym_owner']}>
                  <OwnerDashboardPage />
                </RoleGuard>
              }
            />
            <Route path="listings" element={<OwnerListingsPage />} />
            <Route path="listings/new" element={<ListingEditorPage />} />
            <Route path="listings/:id/edit" element={<ListingEditorPage />} />
            <Route
              path="reviews"
              element={
                <RoleGuard allow={['gym_owner']}>
                  <OwnerReviewsPage />
                </RoleGuard>
              }
            />
            <Route
              path="plans"
              element={
                <RoleGuard allow={['gym_owner']}>
                  <PricingPlansPage />
                </RoleGuard>
              }
            />
            <Route
              path="plans/:planKey/checkout"
              element={
                <RoleGuard allow={['gym_owner']}>
                  <PaymentCheckoutPage />
                </RoleGuard>
              }
            />
            <Route
              path="check-in"
              element={
                <RoleGuard allow={['gym_owner']}>
                  <OwnerCheckInPage />
                </RoleGuard>
              }
            />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
