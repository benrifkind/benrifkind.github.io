$(document).ready(function() {
  $('.orange').click(function() {
                $(this).fadeOut('fast');
                });
  $('.green').click(function() {
                $(this).fadeOut('slow');
                });

  $('#calculate').click(function(){
    var principal = $('#principal').val();
    var interest = $('#interest').val()
    interest = (interest*0.01)/12.0;
    var years = $('#years').val();
    var ppa = principal*( interest  + interest/( Math.pow(1+interest,years*12) - 1) )

    $("#payment").append('<p>'   +  ppa.toFixed(2).toString() + ' </p>')
    console.log(ppa)
  });

});

// $(document).ready(function() {
//   $(#calculate).click(function(){
//     var principal = $(#principal).val();
//     var interest = $(#interest).val();
//     var years = $(#numyears).val();
//     var ppa = principal*( i + i/( (1+i)**(years*12) - 1) )
//     $("td").append('<p> jack the rabbit </p>')
//   })

// })

/* interest, numyears, principal

/*
def amortize(principal, interest, years):
  i = (interest*0.01)/12.0
  return principal*( i + i/( (1+i)**(years*12) - 1) )
*/
