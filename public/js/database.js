function DatabasePage() {

    var siteProfiles, sshConfig;
//    var databaseIo = io.connect('/database');

    var $container = $('#database');
    var $display = $('#database-display');
    var $inputContainer = $('#database-inputs');
    var $tableCheckboxTemplate = $('#table-checkboxes-template').remove().children();

    Tools.getSiteProfilesSelect(function($select, data){
        $('#site-profile').append($select);
        siteProfiles = data;
        Tools.getSshConfig(function(data){
            sshConfig = data;
        });
    });

    setupEvents();
    setupDefaults();
//    setupSocket();

    /**
     * Sets up events
     */
    function setupEvents() {
        //Site Profile
        $inputContainer.on('change', 'select[name=site-profile]', function(event){
            var key = $(this).val();
            var selectedProfile = siteProfiles[key];
            var selectedSshConfig = sshConfig[selectedProfile['sshConfigName']];
            $display.find('.site-profile').text(selectedProfile['profileName']);
            $display.find('.site-host').text(selectedSshConfig['host']);
            $display.find('.site-username').text(selectedSshConfig['user']);
        });

        //Password or Key
        $('input[type=radio][name=pass-or-key]').on('click', function(event){
            var $formContainer = $('#pass-or-key');
            var $passContainer = $('#password-container');
            var $label = $display.find('.site-auth .label');

            if ($(event.target).val() == 'password' && $passContainer.length < 1) {
                var $input = $('<div class="form-group" id="password-container"><label for="password">Password</label><input type="text" class="form-control"  name="password" /></div>');
                $formContainer.append($input);
                $label.text('Password');
            }
            else if ($(event.target).val() == 'key') {
                $passContainer.remove();
                $label.text('Private Key');
            }
        });

        //Type of DB dump
        $('input[type=radio][name=dump-type]').on('click', function(event){
            var $typeContainer = $('#dump-type');
            var $tableContainer = $('#table-checkboxes-container');
            var $label = $display.find('.dump-type .label');

            if ($(event.target).val() == 'selective' && $tableContainer.length < 1) {
                var $checkboxes = $tableCheckboxTemplate.clone();
                $typeContainer.append($checkboxes);
                setupTableCheckboxes();

                $label.text('Selective');
            }
            else if ($(event.target).val() == 'full') {
                $tableContainer.remove();
                $label.text('Full');
            }
        });

        //Action buttons
        $('#test-connection, #testMysqlDump').on('click', function(event){
            var $inputs = $('#database-form').find(':input').not(':button');
            if (!Tools.validate($inputs, $container)) {
                return false;
            }

            var url;
            if ($(this).is('#testMysqlDump')) {
                url = '/testMysqlDump';
            }
            else {
                url = '/testDatabaseConnection';
            }

            Tools.showWait();

            var $messages = $('#database-messages');
            $messages.empty();

            $.ajax({
                url: url,
                dataType: 'json',
                type: 'POST',
                data: $inputs.serialize(),
                success: function(data) {
                    if (data['messages'] && data['messages'].length) {
                        $.each(data['messages'], function(i, val){
                            $messages.append($('<li class="list-group-item bg-success"></li>').text(val));
                        });
                    }
                    if (data['error']) {
                        $messages.append($('<li class="list-group-item bg-danger"></li>').text(data['error']));
                    }
                    console.log('testDatabaseConnection::onsuccess', data);
                },
                error: function(xhr, status, errorThrown){
                    var response = xhr.responseText;
                    if (status == 'parsererror') {
                        console.error('Error with response from database connection test:', response, errorThrown);
                    }
                },
                complete: function() {
                    Tools.hideWait();
                }
            });
        });
    }

    /**
     * Sets up form defaults on page load
     */
    function setupDefaults() {
        $('input[type=radio][name=pass-or-key].key').trigger('click');
        $('input[type=radio][name=dump-type].selective').trigger('click');
    }

    function setupSocket() {
        databaseIo.on('connect', function(){
            console.log('db socket connect');
            databaseIo.on('db-message', function(message){
                console.log('FROM SOCKET :: db-message', message);
            });
        });
    }

    /**
     * Creates elements and attaches events for db table checkboxes
     */
    function setupTableCheckboxes() {
        var tables = ['log_visitor_online', 'log_visitor_info', 'log_visitor', 'log_url_info', 'log_url', 'log_summary_type', 'log_summary', 'log_quote', 'log_customer', 'enterprise_customer_sales_flat_quote_address', 'enterprise_customer_sales_flat_quote', 'enterprise_customer_sales_flat_order_address', 'enterprise_customer_sales_flat_order', 'enterprise_logging_event', 'enterprise_logging_event_changes', 'sales_shipping_aggregated_order', 'sales_shipping_aggregated', 'sales_refunded_aggregated_order', 'sales_refunded_aggregated', 'sales_recurring_profile_order', 'sales_recurring_profile', 'sales_payment_transaction', 'sales_order_tax_item', 'sales_order_tax', 'sales_order_aggregated_updated', 'sales_order_aggregated_created', 'sales_invoiced_aggregated_order', 'sales_invoiced_aggregated', 'sales_flat_shipment_track', 'sales_flat_shipment_item', 'sales_flat_shipment_grid', 'sales_flat_shipment_comment', 'sales_flat_shipment', 'sales_flat_quote_shipping_rate', 'sales_flat_quote_payment', 'sales_flat_quote_item_option', 'sales_flat_quote_item', 'sales_flat_quote_address_item', 'sales_flat_quote_address', 'sales_flat_quote', 'sales_flat_order_status_history', 'sales_flat_order_payment', 'sales_flat_order_item', 'sales_flat_order_grid', 'sales_flat_order_address', 'sales_flat_order', 'sales_flat_invoice_item', 'sales_flat_invoice_grid', 'sales_flat_invoice_comment', 'sales_flat_invoice', 'sales_flat_creditmemo_item', 'sales_flat_creditmemo_grid', 'sales_flat_creditmemo_comment', 'sales_flat_creditmemo', 'sales_billing_agreement_order', 'sales_billing_agreement', 'sales_bestsellers_aggregated_yearly', 'sales_bestsellers_aggregated_monthly', 'sales_bestsellers_aggregated_daily', 'report_viewed_product_index', 'report_viewed_product_aggregated_yearly', 'report_viewed_product_aggregated_monthly', 'report_viewed_product_aggregated_daily', 'report_event', 'report_compared_product_index', 'customer_entity_varchar', 'customer_entity_text', 'customer_entity_int', 'customer_entity_decimal', 'customer_entity_datetime', 'customer_entity', 'customer_address_entity_varchar', 'customer_address_entity_text', 'customer_address_entity_int', 'customer_address_entity_decimal', 'customer_address_entity_datetime', 'customer_address_entity'];
        var container = $('#table-checkboxes');
        var len = tables.length;
        for (var i = 0; i < len; i++) {
            var $chkContainer = $('<div class="col-md-6"></div>').append('<div class="checkbox"></div>');
            var label = $('<label></label>')
                .text(tables[i])
                .attr('for', tables[i])
                .appendTo($chkContainer.children());
            var checkbox = $('<input type="checkbox" />')
                .attr('name', 'tables')
                .attr('id', tables[i])
                .prop('checked', true)
                .val(tables[i])
                .appendTo(label);
            container.append($chkContainer);
        }
        $('<div style="clear:both"></div>').appendTo(container);

        //Checkbox toggles for tables
        var $tableControls = $('#table-controls');
        $tableControls.on('click', '.select-all', function(){
            $('#table-checkboxes').find('input[type=checkbox]').prop('checked', true);
        });
        $tableControls.on('click', '.select-none', function(){
            $('#table-checkboxes').find('input[type=checkbox]').prop('checked', false);
        });

        $('#tables-toggle').on('click', function(){
            var $tablesContent = $('#tables-content');
            if (!$tablesContent.hasClass('show')) {
                $tablesContent.addClass('show').slideDown();
                $(this).find('span').removeClass('glyphicon-expand').addClass('glyphicon-collapse-down');
            }
            else {
                $tablesContent.removeClass('show').slideUp();
                $(this).find('span').removeClass('glyphicon-collapse-down').addClass('glyphicon-expand');
            }
        });
    }
}
