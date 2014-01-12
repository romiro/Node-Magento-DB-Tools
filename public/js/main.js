jQuery(
function(){

    var navigation = new Navigation();


    var host, username, password, dbname, data;

    var firstTemplate = function() {
        return 'mysqldump -d -h{{host}} -u{{username}} -p {{dbname}} > {{filename}}';
    };

    var secondTemplate = function(){
        var string = 'mysqldump -h{{host}} -u{{username}} -p';
        $('#table-checkboxes').find('input[type=checkbox]:checked').each(function(){
            string += ' --ignore-table={{table_prefix}}{{dbname}}.' + $(this).val();
        });
        string += " {{dbname}} >> {{filename}}";
        return string;
    };

    var fullDumpTemplate = function() {
        return 'mysqldump -h{{host}} -u{{username}} -p {{dbname}} | gzip -c | cat > {{filename}}.gz';
    };

    var clientTemplate = function(){
        return 'mysql -h{{host}} -u{{username}} -p {{dbname}}';
    };

    setupEvents();
    renderCheckboxes();

    //Events
    function setupEvents() {
        $('#parse-localxml').on('click', function(){
            var xmlString = $('#localxml').val();
            var xml = $.parseXML( xmlString );

            var tablePrefix = '';
            if ($(xml).find('table_prefix').length) {
                tablePrefix = $(xml).find('table_prefix').text();
            }

            data = {
                host: $(xml).find('host').text(),
                username: $(xml).find('username').text(),
                password: $(xml).find('password').text(),
                dbname: $(xml).find('dbname').text(),
                table_prefix: tablePrefix,
                filename: $(xml).find('dbname').text() + "-" + getDate() + ".sql"
            };

            var firstCommand = template(firstTemplate(), data);
            var secondCommand = template(secondTemplate(), data);
            var fullDumpCommand = template(fullDumpTemplate(), data);
            var clientCommand = template(clientTemplate(), data);

            $('#first-command').val(firstCommand);
            $('#second-command').val(secondCommand);

            $('#fulldump-command').val(fullDumpCommand);
            $('#client-command').val(clientCommand);

            $('#password').val(data.password);
        });

        //Select all text event
        $('button.select-all-text').on('click', function(){
            $(this).siblings('input[type=text]').select();
        });

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
                $(this).removeClass('glyphicon-collapse-down').addClass('glyphicon-collapse-up');
            }
            else {
                $tablesContent.removeClass('show').slideUp();
                $(this).removeClass('glyphicon-collapse-up').addClass('glyphicon-collapse-down');
            }
        });
    }

    //Helper methods

    function template(string, data) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var re = new RegExp("{{"+key+"}}", "gi");
                string = string.replace(re, data[key]);
            }
        }
        return string;
    }

    function getDate() {
        var date = new Date();
        var month = (date.getMonth() + 1).toPrecision();
        var day = date.getDate().toPrecision();
        var string = '';

        string += date.getFullYear();
        string += month.length == 1 ? "0" + month : month;
        string += day.length == 1 ? "0" + day : day;
        return string;
    }


    //One-time rendering methods

    function renderCheckboxes() {
        var tables = ['log_visitor_online', 'log_visitor_info', 'log_visitor', 'log_url_info', 'log_url', 'log_summary_type', 'log_summary', 'log_quote', 'log_customer', 'enterprise_customer_sales_flat_quote_address', 'enterprise_customer_sales_flat_quote', 'enterprise_customer_sales_flat_order_address', 'enterprise_customer_sales_flat_order', 'enterprise_logging_event', 'enterprise_logging_event_changes', 'sales_shipping_aggregated_order', 'sales_shipping_aggregated', 'sales_refunded_aggregated_order', 'sales_refunded_aggregated', 'sales_recurring_profile_order', 'sales_recurring_profile', 'sales_payment_transaction', 'sales_order_tax_item', 'sales_order_tax', 'sales_order_status_state', 'sales_order_status_label', 'sales_order_status', 'sales_order_aggregated_updated', 'sales_order_aggregated_created', 'sales_invoiced_aggregated_order', 'sales_invoiced_aggregated', 'sales_flat_shipment_track', 'sales_flat_shipment_item', 'sales_flat_shipment_grid', 'sales_flat_shipment_comment', 'sales_flat_shipment', 'sales_flat_quote_shipping_rate', 'sales_flat_quote_payment', 'sales_flat_quote_item_option', 'sales_flat_quote_item', 'sales_flat_quote_address_item', 'sales_flat_quote_address', 'sales_flat_quote', 'sales_flat_order_status_history', 'sales_flat_order_payment', 'sales_flat_order_item', 'sales_flat_order_grid', 'sales_flat_order_address', 'sales_flat_order', 'sales_flat_invoice_item', 'sales_flat_invoice_grid', 'sales_flat_invoice_comment', 'sales_flat_invoice', 'sales_flat_creditmemo_item', 'sales_flat_creditmemo_grid', 'sales_flat_creditmemo_comment', 'sales_flat_creditmemo', 'sales_billing_agreement_order', 'sales_billing_agreement', 'sales_bestsellers_aggregated_yearly', 'sales_bestsellers_aggregated_monthly', 'sales_bestsellers_aggregated_daily', 'report_viewed_product_index', 'report_viewed_product_aggregated_yearly', 'report_viewed_product_aggregated_monthly', 'report_viewed_product_aggregated_daily', 'report_event', 'report_compared_product_index', 'customer_entity_varchar', 'customer_entity_text', 'customer_entity_int', 'customer_entity_decimal', 'customer_entity_datetime', 'customer_entity', 'customer_address_entity_varchar', 'customer_address_entity_text', 'customer_address_entity_int', 'customer_address_entity_decimal', 'customer_address_entity_datetime', 'customer_address_entity'];
        var container = $('#table-checkboxes');
        var len = tables.length;
        for (var i = 0; i < len; i++) {
            var chkContainer = $('<div class="checkbox col-md-6"></div>');
            var label = $('<label></label>')
                .text(tables[i])
                .attr('for', tables[i])
                .appendTo(chkContainer);
            var checkbox = $('<input type="checkbox" />')
                .attr('name', 'tables')
                .attr('id', tables[i])
                .prop('checked', true)
                .val(tables[i])
                .appendTo(label);
            container.append(chkContainer);
        }
        $('<div style="clear:both"></div>').appendTo(container);
    }


});