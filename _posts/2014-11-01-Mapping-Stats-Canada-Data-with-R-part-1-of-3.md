---
title: "Mapping Stats Canada Data with R part 1 of 3"
layout: post
tags: [web scraping, python, BeautifulSoup, Stats Canada]
output: html_document
---
#Introduction
I applied to the [Insight data science program](http://insightdatascience.com/) pretty much immediately after I finished my phD in September. I didn't have much programming experience (still don't) but I was learning R and wanted to do something to showcase what I had learnt. I settled on doing a map of the densities of the different ethnic groups in Canada by census division. I just thought it would be interesting to see where different immigrant communities settle. 

There were three basic parts to this project. 

1. Get the data from Stats Canada. This was not one simple download. I used [BeautifulSoup](http://www.crummy.com/software/BeautifulSoup/) to scrape the Stats Canada web site.
2. Organize and combine the data along with the actual mapping. This was some simple R code along with learning a little bit of [ggmaps](http://cran.r-project.org/web/packages/ggmap/ggmap.pdf)
3. Construct an interactive map online. I used the [Shiny](http://shiny.rstudio.com/) web application framework for R for this.

Three different parts to that project add up to three different parts to this post.

#Part 1 - Web Scraping Stats Canada 

I went to [the Stats Canada web site](http://www.statcan.gc.ca/start-debut-eng.html) to look for this data. Unfortunately the long form census was discontinued in 2011, so I had to rely on the 2006 census. I focused on the ethnic characteristics of the questionnaire. This is a [link](http://www12.statcan.gc.ca/census-recensement/2006/dp-pd/tbt/Rp-eng.cfm?LANG=E&APATH=3&DETAIL=0&DIM=0&FL=A&FREE=0&GC=0&GID=0&GK=0&GRP=1&PID=99015&PRID=0&PTYPE=88971,97154&S=0&SHOWALL=0&SUB=0&Temporal=2006&THEME=70&VID=0&VNAMEE=&VNAMEF=) to the stats that I was looking at aggregated over all of Canada. I wanted the data for each census division which for some reason Stats Canada did not make available as one single download. I would have had to click through each division [here][censusdivisions] in order to retrieve all the data. So of course what I did instead was I scraped the data from that page using python, regular expressions, and BeautifulSoup.

{% highlight python %}
import urllib
from bs4 import BeautifulSoup, SoupStrainer
import re
import os
{% endhighlight %}

I started at the [base page][censusdivisions] and took a look at the html code to see what all the census division links had in common. All the links had tags 'li'. The provinces were of class 'indent-1', the census divisions were of class, "indent-3", and the subdivisions were of class 'indent-5'. And the links are listed in inherited order - provinces -> divisions -> subdivisions. I'm interested in the census divisions along with the provinces (just as placeholders). 

I found parsing the page a bit buggy. I had to use the "html5lib" parser to get all the links.

{% highlight python %}
#the base page
url = "http://www12.statcan.gc.ca/census-recensement/2006/dp-pd/tbt/Geo-index-eng.cfm?TABID=5&LANG=E&APATH=3&DETAIL=0&DIM=0&FL=A&FREE=0&GC=0&GID=0&GK=0&GRP=1&PID=99015&PRID=0&PTYPE=88971,97154&S=0&SHOWALL=0&SUB=0&Temporal=2006&THEME=70&VID=0&VNAMEE=&VNAMEF=&D1=0&D2=0&D3=0&D4=0&D5=0&D6=0"

#get the links
soup = BeautifulSoup(requests.get(url).content, "html5lib")
links = soup.find_all("li", class_ = re.compile('indent-[1|3]'))
{% endhighlight %}

I still wasn't there yet. These links just take me to another page where I have the option to click on a link to download the csv files. But I noticed that these new links are of the form begin + PID + "&"" + GID +end, where begin and end are some fixed string and PID and GID are information contained in the link. So I wrote a function to extract the link to download the csv files from the first link.

{% highlight python}
def get_csv_link(weblink):
    #extract the pid and gid from the link
    PID = re.search("PID=\d+", weblink).group()
    GID = re.search("GID=\d+", weblink).group()
    #construct link to the csv file
    begin = "http://www12.statcan.gc.ca/census-recensement/2006/dp-pd/tbt/File.cfm?S=0&LANG=E&A=R&"
    end = "&D1=0&D2=0&D3=0&D4=0&D5=0&D6=0&OFT=CSV"   
    return begin + PID + '&' + GID + end  
{% endhighlight %}

Now I just retrieve a dictionary of dictionaries of urls. First level is the name of the province, second level is name of the census division and the final level is url of the csv for that division. This structure helps keep things organized.

{% highlight python %}
list_divs = {}
province = ''
for link in links[1:]: #skip first link Canada 
    if (link['class'][0] == 'indent-1'): 
        province = re.sub(" /.+", "", link.a.string) #removes french name and /
    else if (link['class'][0] == 'indent-3'):
        if (province != ''):
            list_divs[province][re.sub(" /.+", "", link.a.string)] = 
                get_csv_link(link.a['href'])
{% endhighlight %}

The last thing to do is to take this structure and use it to download the csv files into the right folders. For each province I make a folder and put all the census division files of that province in that folder.

{% highlight python  %}
for province in list_divs.keys():
    os.mkdir(province)
    for division in x[province]:
        urllib.urlretrieve(list_divs[province][division], province + "/" + division+".csv")
{% endhighlight %}

Next up: cleaning and combing the csv files to get data I can map

[censusdivisions]: http://www12.statcan.gc.ca/census-recensement/2006/dp-pd/tbt/Geo-index-eng.cfm?TABID=5&LANG=E&APATH=3&DETAIL=0&DIM=0&FL=A&FREE=0&GC=0&GID=0&GK=0&GRP=1&PID=99015&PRID=0&PTYPE=88971,97154&S=0&SHOWALL=0&SUB=0&Temporal=2006&THEME=70&VID=0&VNAMEE=&VNAMEF=&D1=0&D2=0&D3=0&D4=0&D5=0&D6=0