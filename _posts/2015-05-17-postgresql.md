---
title: "Postgresql - Restaurant Inspections in NYC"
layout: post
tags: [postgresql, restaurant inspections, pandas]
output: html_document
---

To start learning postgresql, I analyzed the inspection records of the restaurants in New York.

[(https://s3.amazonaws.com/thedataincubator/coursedata/nyc_inspection_data.zip)](https://s3.amazonaws.com/thedataincubator/coursedata/nyc_inspection_data.zip)

The data was a bit messy with some unnecessary href tags so I used python to remove these and clean up the data a little bit. I'll spare the details but the code is [here](https://github.com/benrifkind/ppsql_restaurant_inspections/blob/master/clean_files.py).

The main file is Webextract.txt which contains the record of all inspections of NYC restaurants from around 2009 to 2014 (though according to the data there are some inspections from 1900?).

Let's take a look at the first few entries of the inspection table.

<div id='grades'>
</div>
<script>
build_table("{{ site.url }}" + "/downloads/DataIncubator/nyc/web_extract_play.txt", 5, 'grades')
</script>

I am mostly interested in the scores. I want to look at different groupings of restaurants and extract the best and worst restaurant scores.  First of all, the higher the score the worse the restaurant did in the inspection - the score keeps track of the number of violations. Notice also that cuisinecode and violcode are just 2-3 character strings. To interpret them we will need the lookup tables Cuisine.txt and Violation.txt. I definitely see a use for sql joins in the near future!

As I said, I will be using postgresql to analyze this data set. The full sql code is available [here](https://github.com/benrifkind/ppsql_restaurant_inspections/blob/master/sql_tables.sql).

### Scores by Zipcode
To start I wanted to know something about the mean grade in the different zipcodes of new york and who was doing the worst:


{% highlight sql %}
-- compute the mean, standard error of the scores in each zipcode
-- order by top scores
CREATE TABLE topscores
AS
SELECT
  zipcode,
  avg(score) as mean,
  stddev(score)/sqrt(count(score)) as std
FROM grades
GROUP BY zipcode
HAVING count(score) > 100
ORDER BY mean DESC;
{% endhighlight %}


<div id='top_bor'>
</div>
<script>
build_table("{{ site.url }}" + "/downloads/DataIncubator/sql/part1.csv", 3, 'top_bor')
</script>

<div>
<p>
I checked the worst scoring zipcode and it's Flushing, NY. I've never been there and now it's slightly lower on my to do list.
</p>
<p>
Obviously I'm also interested to see which zipcodes have the best scores and how much better those grades are.
</p>
</div>

<div id='bot_bor'>
</div>
<script>
build_table("{{ site.url }}" + "/downloads/DataIncubator/sql/part1asc.csv", 3, 'bot_bor')
</script>

I looked up the top zipcode - this is the neighbourhood right around Rockefeller Center. Probably a lot of volume down there so things need to be kept fairly clean. Also the 10 point difference seems pretty significant.

### By Cuisine Type ###
Now let's look at cuisine types. I want to see what the average scores are of different cuisine types. Notice the join we need to do with the cuisine lookup table to get a descriptive string of the cuisine type. First up the worst scoring cuisine types.

{% highlight postgresql %}
CREATE TABLE cuisinescores
  as
  SELECT
    codedesc,
    avg(score) as mean,
    stddev(score)/sqrt(count(score)) as stderr,
    count(score) as numinspect
  FROM grades inner join cuisine
    using (cuisinecode)
  GROUP BY codedesc
  order by mean DESC;
{% endhighlight %}

<div id='bot_cuis'>
</div>
<script>
build_table("{{ site.url }}" + "/downloads/DataIncubator/sql/part3.csv", 5, 'bot_cuis')
</script>

And of course we need to look at the flip side of this. Which cuisine types are not keeping such clean establishments?

<div id='top_cuis'>
</div>
<script>
build_table("{{ site.url }}" + "/downloads/DataIncubator/sql/part3asc.csv", 5, 'top_cuis')
</script>

So at first glance, it seems that the simpler the food prep is the better the inspection score. Probably could have guessed that but it's nice to see it in the data. One outlier here is Ethiopian food. I don't think the food prep there is that simple but it scores quite well.

As a side note, I'm curious how prevalent a type of restaurant has to be to break out of regional categorization. I'm thinking African versus Ethiopian. And I also noticed that there is no subcategory for sushi restaurants. Seems like they're all considered Japanese restaurants.

### Disproportionate violations per cuisine code ###
The next question I try to answer is which cuisines have a disproportionate number of which violations. Notice that more prevalent cuisine categories will have more violations because there are more such restaurants. And there are also more common types of violations across all cuisine types.

To to take of this normalization issue we look at the conditional probability of a particular violation given a cuisine code normalized (divided by) the probability of that violation over the whole data set.

Just to make things more complicated the violation codes change over time. As an example '01D' could mean "Current valid food vendor license not available" or "Failure to comply with an Order of the Board Commissioner or Department" depending on the date of inspection. To take care of that we first do a join with the violation table and then keep only the violation descriptions which were valid on the date of inspection.

{% highlight postgresql %}
CREATE TABLE grade_viol_descript
AS
SELECT cuisinecode, violationdesc
FROM
(SELECT
  cuisinecode,
  violcode,
  inspdate,
  startdate,
  enddate,
  violationdesc
  FROM grades
  JOIN violation
ON violcode = violationcode
WHERE startdate < inspdate and inspdate < enddate) AS foo;
{% endhighlight %}


Now we have to do a bunch of frequency counting. We need a count of the total number of violations,
violations per cuisine code, violations per violation code, and violations per cuisine code, violation code (number of particular violations of a cuisine code). And I'm sure that will be a lot clearer in the sql below!

{% highlight postgresql %}
CREATE TABLE viol_counts
as
SELECT cuisinecode, violationdesc, viol_c, viol_v, viol_v_c,
      (sum(viol_v_c) over()) as viol_total
FROM
  (SELECT
    cuisinecode,
    violationdesc,
    count(*) as viol_v_c
  FROM grade_viol_descript
  GROUP BY cuisinecode, violationdesc
  )as viols_v_c
  join
  (SELECT
    cuisinecode,
    count(*) as viol_c
  FROM grade_viol_descript
  GROUP BY cuisinecode
  ) as viols_c
  using(cuisinecode)
  join
  (SELECT
    violationdesc,
    count(*) as viol_v
  FROM grade_viol_descript
  GROUP BY violationdesc
  ) as viols_v
  using(violationdesc);
{% endhighlight %}

Now we can use the counts to get the probabilities of all the different violation configurations and from that calculate the ratio we are interested in. This ratio is skewed when the number of violations of a the particular cuisine is small or when the count of the particular violation is small. To avoid this we select out only those points with more than 100 violations of a certain cuisine code and particular violation.

{% highlight postgresql %}
CREATE TABLE viol_probs
AS
SELECT
      violationdesc,
      cuisinecode,
      viol_c,
      viol_v,
      viol_v_c,
      p_v_c,
      p_v,
      p_v_c/p_v as ratio
FROM
  (
  SELECT violationdesc,
        cuisinecode,
        (cast(viol_v_c as float))/viol_c as p_v_c,
        viol_v/viol_total as p_v,
        viol_c,
        viol_v,
        viol_v_c
  FROM
    viol_counts
  where viol_v_c > 100
  ) as pre_viol_prob;
{% endhighlight %}


<div id='part4'>
</div>

<script>
build_table("{{ site.url }}" + "/downloads/DataIncubator/sql/part4.csv", 10, 'part4')
</script>

As I said earlier, there is no category for sushi restaurants. And so Japanese encompasses a lot of sushi restaurants which I guess do not handle raw (sea) food in a way that makes health inspectors very happy. The issue of not holding food certificates and posters not being placed properly for is slightly interesting but probably misleading here. I should be selecting out 'significant' inspection violation. The other thing to notice is that cooling and heating food are the main issues rounding out the top ten. This makes a lot of sense to me. When food is being served to customers time is an issue and it takes time and organization to thaw and cool food properly.

### Final thoughts ###
I didn't love working in postgresql. I did the same analysis in pandas and it felt much cleaner with much more exploratory freedom. In particular setting up the tables in sql was a real pain. There were lots of encoding errors and incorrect data types and fixing these errors was somewhat laborious mostly because it took a lot of trial and error to figure out what was wrong. Of course it was a bit nonsensical to use sql in this analysis because these data sets will actually load in memory. I definitely see the use of working with sql when the data sets are much bigger and I have developed a bit of a feel for the syntax so all around I'd say this was a worthwhile exercise for me.

<script src="{{site.ur}}/assets/js/jquery-2.1.4.min.js"></script>
<script src="{{ site.url }}/assets/js/d3/d3.v3.js"></script>
<script src="{{ site.url }}/assets/js/utils/table.js"></script>
