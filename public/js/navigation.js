function Navigation() {

    findActiveLink();
    setupEvents();

    function setupEvents() {
        //junk event
        $('.navbar-nav li a').on('click', function(){
            $(this).parents('ul').find('li').removeClass('active');
            $(this).parent('li').addClass('active');
        });
    }

    function findActiveLink() {
        var path = ""+document.location.pathname;
        $('#navigation').find('a').each(function(i,e){
            if ($(e).attr('href') == path) {
                $(e).parent('li').addClass('active');
                return false;
            }
        });
    }
}