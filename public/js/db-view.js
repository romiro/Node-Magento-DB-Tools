var DatabaseView = Object.subClass({

    init: function() {
        this.$template = $('#template').children().first().clone();
        this.$container = $('.database-view');
        this.data = null;
        this.singularName = '';
        this.pluralName = '';
    },

    getData: function(callback) {
        var self = this;
        $.ajax({
            url: Tools.format('/%s/getAll', this.pluralName),
            dataType: 'json',
            success: function(data){
                self.data = data;
                callback(data);
            }
        });
    },

    getDataFrom: function(type, callback) {
        var self = this;
        type = Tools.capitalize(type);
        $.ajax({
            url: Tools.format('/%s/getAll', type),
            dataType: 'json',
            success: function(data){
                callback(data);
            }
        });
    },

    setupEvents: function() {
        var self = this;

        //Save button
        this.$container.on('click', '.save-button', function(event){
            var $inputContainer = $(event.target).parents('.panel-primary');
            var $inputs = $inputContainer.find(':input').not(':button');
            if (!Tools.validate($inputs, self.$container)) {
                return false;
            }
            $.ajax({
                url: Tools.format('/%s/save', self.pluralName),
                type: 'POST',
                data: $inputs.serialize(),
                success: function() {
                    document.location = document.location;
                }
            });
        });

        //Delete button
        this.$container.on('click', '.delete-button', function(event){
            var $inputContainer = $(event.target).parents('.panel-primary');
            var name = $inputContainer.find('input.name').val();
            if (!window.confirm(Tools.format('Do you wish to delete %s "%s"?', self.singularName, name))) {
                return false;
            }
            var id = $inputContainer.find(':input[name=id]').val();

            $.ajax({
                url: Tools.format('/%s/delete', self.pluralName),
                type: 'POST',
                data: {id: id},
                success: function() {
                    document.location = document.location;
                }
            });
        });

        this.$container.on('click', '.edit .panel-heading', function(event){
            var $panelBody = $(this).siblings('.panel-body');
            var slideDuration = 200;
            $panelBody.toggleClass('show-panel');
            if ($panelBody.hasClass('show-panel')) {
                $panelBody.slideDown(slideDuration);
            }
            else {
                $panelBody.slideUp(slideDuration);
            }

        });
    },

    beforeRender: function() {},

    render: function() {
        var self = this;
        $.each(this.data, function(i, record){
            var $record = self.$template.clone().addClass('edit panel-primary');
            $.each(record, function(key, val){
                $record.find(Tools.format(':input[name=%s]', key)).val(val);
            });

            $record.prepend($('<div class="panel-heading"></div>').text(record[self.singularName.toLowerCase() + '_name']));

            //Save button
            $record.find('.panel-body').append('<div class="buttons"><button type="button" class="save-button btn btn-primary">Save</button></div>');

            //Delete button
            $record.find('.panel-body').append('<div class="buttons"><button type="button" class="delete-button btn btn-xs btn-danger">Delete</button></div>');

            self.$container.append($record);
        });

    },

    createAddBlock: function() {
        var $addBlock = this.$template.clone().addClass('add panel-success');
        $addBlock.prepend(Tools.format('<div class="panel-heading">New %s</div>', this.singularName));
        $addBlock.find('.panel-body').append($('<div class="buttons"><button type="button" class="save-button btn btn-success">Add</button></div>'));
        this.$container.prepend($addBlock);
    },

    finish: function() {
        this.beforeRender();
        this.createAddBlock();
        this.render();
        this.setupEvents();
    }
});


var Clients = DatabaseView.subClass({
    init: function() {
        this._super();

        this.singularName = 'Client';
        this.pluralName = 'Clients';

        var self = this;
        this.getData(function(data){
            self.finish();
        });
    }
});

var Servers = DatabaseView.subClass({
    init: function() {
        this._super();

        this.singularName = 'Server';
        this.pluralName = 'Servers';
        var self = this;

        this.getData(function(data){
            self.getDataFrom('clients', function(data){
                self.clientData = data;
                self.getDataFrom('SshConfig', function(data){
                    self.sshConfigData = data;
                    self.finish();
                });
            });
        });
    },

    beforeRender: function() {
        var self = this;
        //Render select boxes for Client data
        this.$template.find('.panel-body select.client_id').each(function(i){
            var $select = $(this);
            $.each(self.clientData, function(i, v){
                $select.append(Tools.format('<option value="%s">%s</option>', v['id'], v['client_name']));
            });
        });
        this._super();
    },

    render: function() {
        var self = this;
        this._super();

        //Change headings to include client name
        this.$container.find('.panel.edit .panel-heading').each(function(i){
            $(this).text(self.data[i].client_name + " - " + $(this).text());
        });


        //Render select box for SSH Config data for the "New" panel only
        var $newPanel = this.$container.find('.panel.add .panel-body');
        $newPanel.find('.form-group.ssh_host, .form-group.ssh_username').remove();
        var $sshContainer = $newPanel.find('.form-group').first().clone().empty();
        $sshContainer.append('<label for="ssh_config">SSH Config Setting</label>');
        var $sshSelect = $('<select name="ssh_config" class="form-control ssh_config"></select>').appendTo($sshContainer);
        $.each(this.sshConfigData, function(i, val){
            $sshSelect.append(Tools.format('<option value="%s">%s</option>', val['label'], val['label']));
        });
        $sshContainer.insertBefore($newPanel.find('div.buttons'));

    }
});

var Profiles = DatabaseView.subClass({
    init: function() {
        this._super();

        this.singularName = 'Profile';
        this.pluralName = 'Profiles';
        var self = this;

        this.getData(function(){
            self.getDataFrom('servers', function(data){
                self.serverData = data;
                self.getDataFrom('excludedTables', function(data){
                    self.excludedTables = data;
                    self.finish();
                });
            });
        });
    },

    beforeRender: function() {
        var self = this;
        //Render select boxes for Server data
        this.$template.find('.panel-body select.server_id').each(function(i){
            var $select = $(this);
            $.each(self.serverData, function(i, v){
                var text = Tools.format('%s - %s', v['client_name'], v['server_name']);
                $select.append(Tools.format('<option value="%s">%s</option>', v['id'], text));
            });
        });
        this._super();
    },

    setupTableCheckboxes: function() {
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
});