---
title: "Mapping Stats Canada Data with R part 2 of 3"
layout: post
output: html_document
---
In this post I will reorganize the data that I have downloaded from the Stats Canada website so that I can start to work with it. Right now I have all census division files from Ontario in the folder "StatsCanadaData/Ontario" and in each file is a csv of all the statistics for that division. I want to extract some interesting  subset of each census division data frame (say country of origin of immigrants) and then merge all these divisions together so that I have one big data frame which I can then use to map and/or visualize the data.

First I need to clean up the csv files. They have a lot of footnotes and header information that I want to remove. The next few lines fix this. I read in the files from a particular province skipping the preamble and the footer, rename the columns, and cleanUp by removing the footnote numbering.


{% highlight r %}
# Read files from a particular province
# Output is a list of data frames
# Skip first 4 rows and look at only 830 total rows of interest since end of file is notes
getProvinceFiles <- function(province){
  province.dir = paste0("StatsCanadaData/", province) 
  file.names = list.files(province.dir, full.name = T)
  names(file.names) = gsub(".csv", "", list.files(province.dir, full.name = F))
  temp = sapply(file.names, read.csv, skip = 5, nrows = 830, 
                col.names = c("Characteristics", "Total", "English", "French", "English and French"), 
                header = F,
                simplify = FALSE)
  # add name of census division to data frame
  for (k in seq(length(names(temp)))){
    temp[[k]][['Division']] = names(temp)[k]
    }
  # clean up Characteristics column
  temp = sapply(temp, cleanUp, simplify = FALSE) 
  temp
  
  }

# gets rid of all the footnote numbering, $ signs I don't like, and spacing issues at 
# the end of the word. 
 cleanUp <- function(df){
   column = "Characteristics"
   df[[column]] = gsub("\\[.+\\]", "", df[[column]])
   df[[column]] = gsub("(\\$$)|(\\$\\s$)", "in CDN", df[[column]])
   df[[column]] = gsub("\\s+$", "", df[[column]])
   df
}
{% endhighlight %}

Now I have a 'nice' list of data frames for each census division

{% highlight r %}
ontario.data = getProvinceFiles("Ontario")
names(ontario.data)
{% endhighlight %}



{% highlight text %}
##  [1] "Algoma"                         "Brant"                         
##  [3] "Bruce"                          "Chatham-Kent"                  
##  [5] "Cochrane"                       "Dufferin"                      
##  [7] "Durham"                         "Elgin"                         
##  [9] "Essex"                          "Frontenac"                     
## [11] "Greater Sudbury"                "Grey"                          
## [13] "Haldimand-Norfolk"              "Haliburton"                    
## [15] "Halton"                         "Hamilton"                      
## [17] "Hastings"                       "Huron"                         
## [19] "Kawartha Lakes"                 "Kenora"                        
## [21] "Lambton"                        "Lanark"                        
## [23] "Leeds and Grenville"            "Lennox and Addington"          
## [25] "Manitoulin"                     "Middlesex"                     
## [27] "Muskoka"                        "Niagara"                       
## [29] "Nipissing"                      "Northumberland"                
## [31] "Ottawa"                         "Oxford"                        
## [33] "Parry Sound"                    "Peel"                          
## [35] "Perth"                          "Peterborough"                  
## [37] "Prescott and Russell"           "Prince Edward"                 
## [39] "Rainy River"                    "Renfrew"                       
## [41] "Simcoe"                         "Stormont, Dundas and Glengarry"
## [43] "Sudbury"                        "Thunder Bay"                   
## [45] "Timiskaming"                    "Toronto"                       
## [47] "Waterloo"                       "Wellington"                    
## [49] "York"
{% endhighlight %}



{% highlight r %}
head(ontario.data[["Algoma"]])
{% endhighlight %}



{% highlight text %}
##                  Characteristics  Total English French English.and.French
## 1 Total population by age groups 116075   95735   8025                585
## 2                   0 to 4 years   4890    4560    145                 50
## 3                   5 to 9 years   5640    5220    225                  0
## 4                 10 to 14 years   7285    6850    235                 10
## 5                 15 to 19 years   8005    7435    340                 45
## 6                 20 to 24 years   6695    6195    265                 75
##   Division
## 1   Algoma
## 2   Algoma
## 3   Algoma
## 4   Algoma
## 5   Algoma
## 6   Algoma
{% endhighlight %}

A word as to how the data frame is organized. Basically there are a bunch of categories in the census for the statistic (income, education, labour) and then there are subcategories and sub-sub-categories. The way that this is organized in the data frame is via the number of spaces before the entry. 0 spaces for head of the category, 2 spaces for the subcategory, 4 spaces for the sub-subcategory, etc. I wrote functions in order to extract the top categories and also the statistics for a given category and its subcategories.

The first function just gets all the top level characteristics of these stats.

{% highlight r %}
# get the top level characteristics of the data frame
# characteristics that includes the word "Total"
# output is a list of the top level characteristics in the data frame
getCharacters <- function(df){
 df[grepl("^Total", df[["Characteristics"]]), ][["Characteristics"]] 
}

characters = getCharacters(ontario.data[[1]])
characters[1:5]
{% endhighlight %}



{% highlight text %}
## [1] "Total population by age groups"                            
## [2] "Total population 15 years and over by legal marital status"
## [3] "Total population 15 years and over by common-law status"   
## [4] "Total population by knowledge of official languages"       
## [5] "Total population by first official language spoken"
{% endhighlight %}

These functions extract the particuar subset and the specified number of subcategories.

{% highlight r %}
# helper function that extracts a particular characteristic of the data and all subcategories
# top category has no spaces at start of the word, sub category has 2 spaces, sub sub has 4 
# input is the data frame and characteristic we want
# value is subset of the data frame
getFullCategory <- function(df, characteristic){
 begin = grep(paste0("\\w*", characteristic), df[["Characteristics"]])
 end = begin
 bool = TRUE
 while (bool){ 
   bool = grepl("^\\s", df[["Characteristics"]][end+1])
   end = end + 1
 }
 return(df[begin:(end-1),])
}

## helper function that extracts a particular characteristic of the data and specified subcat
# input is the data frame, characteristics, and number of subcategories
# value is subset of the data frame
getSubCategory <- function(df, characteristic, depth){
 depth = 2*depth +1
 temp = getFullCategory(df, characteristic)
 temp[!(grepl(paste0("^\\s{", depth,"}"), temp[["Characteristics"]])),]
}
{% endhighlight %}

Here I construct a function that takes in a list of data frames along with a characteristic that
we want and outputs one big data frame of that characteristic and subcharacteristics.

{% highlight r %}
# Construct data frame of characteristic over all census divisions
# input is list of data frames, characteristic
# output is data frame
getCharDataFrame <- function(df.list, characteristic, depth = 2){
  temp = sapply(df.list, getFullCategory, 
                characteristic = characteristic,
                simplify = F)
  total = do.call(rbind, temp) #put all data frames together
  row.names(total) = NULL
  #reorder the data frame according to Characteristics
  characteristics = temp[[1]][[1]]
  total[['Characteristics']] = factor(total[['Characteristics']], 
                                      levels = characteristics)
  total = total[order(total[['Characteristics']]),]
  
  total[, c(1,6,2,3,4,5)]
} 
{% endhighlight %}

"Total population by immigrant status and place of birth" looks like an interesting statistic. I construct a big data frame of all the census divisions of "Ontario" with that stat and write it to a csv file.

{% highlight r %}
immigrant.status = getCharDataFrame(ontario.data, "Total population by immigrant status and place of birth", characters[23])
head(immigrant.status)
{% endhighlight %}



{% highlight text %}
##                                             Characteristics     Division
## 1   Total population by immigrant status and place of birth       Algoma
## 39  Total population by immigrant status and place of birth        Brant
## 77  Total population by immigrant status and place of birth        Bruce
## 115 Total population by immigrant status and place of birth Chatham-Kent
## 153 Total population by immigrant status and place of birth     Cochrane
## 191 Total population by immigrant status and place of birth     Dufferin
##      Total English French English.and.French
## 1   116080   95730   8025                585
## 39  123320  108755   1330                120
## 77   64555   59580    545                 55
## 115 107150   93405   2885                345
## 153  81465   36660  38115               1130
## 191  53920   49360    595                 90
{% endhighlight %}



{% highlight r %}
write.csv(immigrant.status, "ImmigrantStatusOntario.csv")
{% endhighlight %}

Next up, mapping this data frame onto a geographical map of Ontario. 
