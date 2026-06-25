output "rg_name" {
  value = azurerm_resource_group.rg.name
}

output "registry_name" {
  value = azurerm_container_registry.acr.name
}

output "registry_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.aks.name
}

output "aks_kubeconfig_cmd" {
  value = "az aks get-credentials --resource-group ${azurerm_resource_group.rg.name} --name ${azurerm_kubernetes_cluster.aks.name} --overwrite-existing"
}

output "key_vault_uri" {
  value = azurerm_key_vault.kv.vault_uri
}

output "mysql_host" {
  value = azurerm_mysql_flexible_server.mysql.fqdn
}

output "mysql_admin_username" {
  value = azurerm_mysql_flexible_server.mysql.administrator_login
}

output "mysql_admin_password" {
  value     = random_password.mysql_admin_password.result
  sensitive = true
}

output "log_analytics_workspace_name" {
  value = azurerm_log_analytics_workspace.law.name
}

output "aks_keyvault_secrets_provider_client_id" {
  value = azurerm_kubernetes_cluster.aks.key_vault_secrets_provider[0].secret_identity[0].client_id
}


