module.exports = {
  admin: {
    label: "Admin",
    description: "Full system access with all permissions",
    permissions: [
      "manage_users",
      "system_settings",
      "view_clients",
      "manage_clients",
      "view_invoices",
      "manage_invoices",
      "view_services",
      "manage_services",
      "fbr_submission",
      "view_dashboard"
    ]
  },
  consultant: {
    label: "Consultant",
    description: "Limited access for tax consultants",
    permissions: [
      "view_clients",
      "manage_invoices",
      "fbr_submission",
      "view_services",
      "view_dashboard"
    ]
  },
  client: {
    label: "Client",
    description: "View-only access to own data",
    permissions: [
      "view_own_invoices",
      "view_own_data",
      "download_documents"
    ]
  }
};
