$(document).ready(function() {


  // this function builds an amortization schedule
  var build_schedule = function(principal, interest, ppa, num_pays){
    // Add headers
     $('table').append("<thead>" +
        "<tr>" +
        "<th >  </th>" +
        "<th > Principle </th>" +
        "<th > Interest</th>" +
        "<th > Cumulative Principle </th>" +
        "<th > Cumulative Interest </th>" +
        "<th > Remainder </th>" +
        "</tr>" +
        "</thead>")


    // adds a row to the html table
    var build_row = function(index, p_paid, int_paid, cum_int, cum_p, p_bal){
       return "<tr>" +
            "<td>" + index +'</td>' +
            "<td>" + p_paid +'</td>' +
            "<td>" + int_paid +'</td>' +
            "<td>" + cum_int +'</td>' +
            "<td>" + cum_p +'</td>' +
            "<td>" + p_bal +'</td>' +
            '</tr>'
      }//end build_row

      //initialize variables
      var cum_interest = 0
      var cum_principal = 0

      for (k=0; k< num_pays; k++){
        var int_pay = principal*interest
        var prince = ppa - int_pay

        principal -= prince
        cum_interest += int_pay
        cum_principal += prince
        $('table').append(build_row(k+1, prince.toFixed(2), int_pay.toFixed(2), cum_principal.toFixed(2), cum_interest.toFixed(2), principal.toFixed(2)))
      } //end loop

    } //end buid_schedule

  // respond to calculate click
  $('#calculate').click(function(){

    // variables that we will need
    // principal, interest rate per payment, number of payments per year
    // number of years, payment ammount
    var principal = $('#principal').val();
    var interest = $('#interest').val()
    var peryear = $('#peryear').val()
    interest = (interest*0.01)/peryear;
    var years = $('#years').val();
    var ppa = principal*( interest  + interest/( Math.pow(1+interest,years*peryear) - 1) )


    //empty the table
    $('#amtable_header').empty()
    $('#paymentplan').empty()


    // Add payments per to the document
    var payments = '<span id = "payammount"> Payment Ammount: $' +
                    ppa.toFixed(2).toString() + '</span><br>'
    var number_payments = '<span id = "numpays"> Number of Payments: ' +
                    parseInt((years*peryear)).toString() + '</span><br>'
    var total_interest = '<span id = "tot_interest"> Total Interest: $' +
                    ((years*peryear)*ppa - principal).toFixed(2).toString() + '</span>'

    $("#payment").html('<div class = "row">' +
                        '<div class="col-md-3" id="paymentammount">' +
                          payments + number_payments + total_interest +
                        '</div>' +
                      '</div>')


    // Build an ammortization schedule
    // check if want schedule
    if ($('#showam').is(":checked")) {
    $('#amtable_header').html("Payment Schedule")
    build_schedule(principal, interest, ppa, peryear*years);
    }; //end sched build

    console.log(ppa)
    console.log($('#showam').is(':checked'))


  }); //end calc click



}); //end ready function


