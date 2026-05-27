# GardenVerse Engineering Checklist

Engineering guardrails for AI agents and contributors. All changes must be validated against this checklist.

## Version
1.0

## Meta Rules

- [ ] no_prisma_in_client_components
- [ ] no_business_logic_in_ui
- [ ] no_undocumented_api_routes
- [ ] no_unvalidated_inputs
- [ ] no_silent_failures

---

## Architecture

### Module Independence
- [ ] modules_dont_import_other_modules_directly
- [ ] events_used_for_cross_module_communication
- [ ] common_utilities_in_src_common
- [ ] config_read_from_configservice_only

### Database
- [ ] prisma_only_no_raw_sql
- [ ] prisma_transactions_for_atomicity
- [ ] indexes_on_frequently_queried_fields
- [ ] pagination_on_all_list_endpoints

---

## API Design

### Validation
- [ ] class_validator_dtos_used
- [ ] request_schema_defined
- [ ] response_type_defined

### Documentation
- [ ] swagger_enabled_for_new_routes
- [ ] endpoint_has_summary_description
- [ ] request_body_schema_present
- [ ] response_schema_present

---

## Security

### Authentication & Authorization
- [ ] jwt_guard_on_protected_routes
- [ ] admin_routes_protected_with_role_guard
- [ ] rate_limiting_on_public_endpoints
- [ ] helmet_and_cors_configured

### Secrets
- [ ] no_secrets_in_code
- [ ] no_secrets_in_logs
- [ ] no_env_files_committed
- [ ] no_api_keys_in_client_code

### Input Validation
- [ ] all_user_input_validated
- [ ] file_upload_type_and_size_validated
- [ ] xss_prevention_active

---

## Performance

- [ ] pagination_applied
- [ ] no_n_plus_one_queries
- [ ] cache_used_where_applicable_redis
- [ ] queries_use_indexes

---

## Logging

- [ ] structured_logger_used
- [ ] start_of_operation_logged
- [ ] success_logged
- [ ] error_logged_with_context
- [ ] no_console_log_in_production

---

## UI/UX (Mobile & Admin)

- [ ] loading_state_present
- [ ] error_state_present
- [ ] empty_state_handled
- [ ] responsive_layout_admin

---

## Maintainability

- [ ] readable_in_isolation
- [ ] domain_driven_naming
- [ ] no_dead_code
- [ ] readme_or_agents_md_updated_if_needed

---

## Testing

- [ ] unit_tests_for_new_services
- [ ] e2e_tests_for_critical_flows_if_time
- [ ] typecheck_passes_npm_run_typecheck
- [ ] existing_tests_not_broken

---

## Final Gate

- [ ] checklist_passed
- [ ] swagger_updated
- [ ] security_reviewed
- [ ] logs_added
- [ ] typecheck_passed
- [ ] lint_passed

---

## Usage

This checklist is a **hard contract** for all AI agents. Before proposing or finalizing any code:

1. Load this checklist
2. Validate all changes against relevant sections
3. Refuse to finalize if any required rule is violated
