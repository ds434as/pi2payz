import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Mainlayout from "../layout/Mainlayout";
import Dashboard from "../pages/dashboard/Dashboard";
import Payin from "../pages/payin/Payin";
import Payout from "../pages/payout/Payout";
import Payoutapproval from "../pages/payout/Payoutapproval";
import Prepayment from "../pages/prepayment/Prepayment";
import Prepaymenthistory from "../pages/prepaymenthistory/Prepaymenthistory";
import Newbalance from "../pages/balance/Newbalance";
import Salesreport from "../pages/salesreport/Salesreport";
import Addbankaccount from "../pages/bank/Addbankaccount";
import Bankaccount from "../pages/bank/Bankaccount";
import Commissions from "../pages/commission/Commissions";
import Registration from "../pages/Registration";
import PayInApproval from "../pages/approval/PayInApproval ";
import Viewbankaccount from "../pages/bank/Viewbankaccount";
import Checkout from "../pages/checkout/Checkout";
import Payoutrequest from "../pages/payout/Payoutrequest";
import Payoutreports from "../pages/salesreport/Payoutreports";
import Apidocs from "../pages/Apidocs";

const isAuthenticated = () => {
  return localStorage.getItem('authToken') !== null;
};

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <PublicRoute><Login /></PublicRoute>
  },
  {
    path: "/registration",
    element: <PublicRoute><Registration /></PublicRoute>
  },
    {
    path: "/payment/docs",
    element: <Apidocs />
  },
    {
    path: "/checkout/:paymentId",
    element: <Checkout />
  },
  {
    path: "/",
    element: <ProtectedRoute><Mainlayout /></ProtectedRoute>,
    children: [
      { 
        path: "/dashboard",
        element: <Dashboard />
      },
      { 
        path: "/pay-in",
        element: <Payin />
      },
      { 
        path: "/pay-in-approval",
        element: <PayInApproval />
      },
      { 
        path: "/pay-out",
        element: <Payout />
      },
      { 
        path: "/pay-out-approval",
        element: <Payoutapproval />
      },
      { 
        path: "/prepayment-requests",
        element: <Prepayment />
      },
      { 
        path: "/prepayment-history",
        element: <Prepaymenthistory />
      },
           { 
        path: "/payout-request",
        element: <Payoutrequest />
      },
          { 
        path: "/payout-reports",
        element: <Payoutreports />
      },
      { 
        path: "/new-balance",
        element: <Newbalance />
      },
      { 
        path: "/sales-report",
        element: <Salesreport />
      },
      {
        path: "/add-bank-account",
        element: <Addbankaccount />
      },
      {
        path: "/bank-accounts",
        element: <Bankaccount />
      },
          {
        path: "/bank-account/:id",
        element: <Viewbankaccount />
      },
      {
        path: "/applied-commission",
        element: <Commissions />
      },
   
    ]
  }
]);

export default router;