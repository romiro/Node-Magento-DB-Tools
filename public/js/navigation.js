function Navigation() {
    setupEvents();
    function setupEvents() {

        //junk event
        $('.navbar-nav li a').on('click', function(){
            $(this).parents('ul').find('li').removeClass('active');
            $(this).parent('li').addClass('active');
        });
    }
}