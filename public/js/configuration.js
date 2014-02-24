$(function(){
    setupEvents();

    $.ajax({
        url: "/getConfig",
        type: "get",
        success: function(data){
            if (typeof data.ssh != 'undefined') {
                buildConfigForm(data.ssh, 'SSH', 'ssh');
            }

            if (typeof data.db != 'undefined') {
                buildConfigForm(data.db, 'MySQL', 'db');
            }
        }
    });

    $.ajax({
        url: "/getSshConfig",
        type: "get",
        success: function(data) {
            var sshConfigData = data;
        }
    });

    function setupEvents() {
        $('#config-save').on('click', function(){
            var data = $('#config-form').find(':input').serialize();
            $.ajax({
                url: '/setConfig',
                type: 'post',
                data: data
            });
        });
    }


    function buildConfigForm(data, label, group) {
        var container = $('<fieldset><h3></h3></fieldset>').appendTo('#config-inputs');
        container.attr('name', group.toLowerCase()).attr('form', 'config-form');
        container.find('h3').text(label + ' Settings');

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var e = $('<div class="form-group"><label for="" class="col-md-3 control-label"></label><div class="col-md-9"><input type="text" class="form-control" id="" /></div></div>');
                var id = label + key;
                e.find('label').attr('for', id).text(label + " " + key);
                e.find('input').attr('id', id).attr('name', group + "[" + key + "]").val(data[key]);
                container.append(e);
            }
        }
    }
});