---
title: "Mapping Stats Canada Data with R part 1 of 3"
layout: post
output: html_document
---
#Introduction
I applied to the [Insight data science program](http://insightdatascience.com/) pretty much immediately after I finished my phD in September. I didn't have much programming experience (still don't) but I was learning R and wanted to do something to showcase what I had learnt. I settled on doing a map of the densities of the different ethnic groups in Canada by census division. I just thought it would be interesting to see where different immigrant communities settle. 

There were three basic parts to this project. 

1. Get the data from Stats Canada. This was not one simple download. I used [BeautifulSoup](http://www.crummy.com/software/BeautifulSoup/) to scrape the Stats Canada web site.
2. Organize and do the actual mapping. This was some simple R code along with learning a little bit of [ggmaps](http://cran.r-project.org/web/packages/ggmap/ggmap.pdf)
3. Construct an interactive map online. I used the [Shiny](http://shiny.rstudio.com/) web application framework for R for this.

Three different parts to that project add up to three different parts to this post.

#Part 1 - Web Scraping Stats Canada 

I went to [the Stats Canada web site](http://www.statcan.gc.ca/start-debut-eng.html) to look for this data. Unfortunately the long form census was discontinued in 2011, so I had to rely on the 2006 census. I focused on the ethnic characteristics of the questionnaire. This is a [link](http://www12.statcan.gc.ca/census-recensement/2006/dp-pd/tbt/Rp-eng.cfm?LANG=E&APATH=3&DETAIL=0&DIM=0&FL=A&FREE=0&GC=0&GID=0&GK=0&GRP=1&PID=99015&PRID=0&PTYPE=88971,97154&S=0&SHOWALL=0&SUB=0&Temporal=2006&THEME=70&VID=0&VNAMEE=&VNAMEF=) to the stats that I was looking at aggregated over all of Canada. I wanted the data for each census division which for some reason Stats Canada did not make available as one single download. I would have had to click through each division [here][censusdivisions] in order to retrieve all the data. So of course what I did instead was I scraped the data from that page using python, regular expressions, and BeautifulSoup.

{% highlight python %}
import httplib2
import urllib
import re
from bs4 import BeautifulSoup, SoupStrainer
{% endhighlight %}

I started at the [base page][censusdivisions] and took a look at the html code to see what all the census division links had in common. Turns out they were all of class, "indent-3" and of type "li". I "strained" all the links of that type

{% highlight python %}
#the base page
base_page = "http://www12.statcan.gc.ca/census-recensement/2006/dp-pd/tbt/Geo-index-eng.cfm?TABID=5&LANG=E&APATH=3&DETAIL=0&DIM=0&FL=A&FREE=0&GC=0&GID=0&GK=0&GRP=1&PID=99015&PRID=0&PTYPE=88971,97154&S=0&SHOWALL=0&SUB=0&Temporal=2006&THEME=70&VID=0&VNAMEE=&VNAMEF=&D1=0&D2=0&D3=0&D4=0&D5=0&D6=0"

#get the links
http = httplib2.Http()
status, response = http.request(base_page)
soup = BeautifulSoup(response)
links = soup.find_all("li", class_="indent-3")
{% endhighlight %}





[censusdivisions]: http://www12.statcan.gc.ca/census-recensement/2006/dp-pd/tbt/Geo-index-eng.cfm?TABID=5&LANG=E&APATH=3&DETAIL=0&DIM=0&FL=A&FREE=0&GC=0&GID=0&GK=0&GRP=1&PID=99015&PRID=0&PTYPE=88971,97154&S=0&SHOWALL=0&SUB=0&Temporal=2006&THEME=70&VID=0&VNAMEE=&VNAMEF=&D1=0&D2=0&D3=0&D4=0&D5=0&D6=0