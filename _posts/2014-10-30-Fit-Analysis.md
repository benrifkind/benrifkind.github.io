---
layout: post
title: "Fit Analysis"
---

{% highlight r %}
library(randomForest)
{% endhighlight %}
Read in the training and testing data

{% highlight r %}
train = read.csv("pml-training.csv", stringsAsFactors = FALSE)
test = read.csv("pml-testing.csv", stringsAsFactors = FALSE)
{% endhighlight %}
I wrote a function to find the indices of the columns in the training data which have not
enough data. They need to have more than 406 entries which are not blank or NA.

{% highlight r %}
#function to find index of columns with very little usable data
#from training data (blanks and NA's)
bad.cols <- function(dataframe, threshold = 406){
  
  #count how many non NA's are in a column
  count.non.nas =  function(x){
    sum(!is.na(x)) 
  }
  #find columns with too many na's
  na.cols = apply(dataframe, MARGIN = 2, count.non.nas) > threshold
  na.cols = which(na.cols == F)
  
  #count how many columns do not have blanks
  count.non.blanks = function(x){
    sum(!(nchar(x) == 0))
  }
  #remove columns with too many blanks
  blank.cols = apply(dataframe, MARGIN = 2, count.non.blanks) > threshold
  blank.cols = which(blank.cols == F)
  
  return(unique(c(na.cols, blank.cols)))
}
{% endhighlight %}
The indices of the unnecessary columns are 

{% highlight r %}
no.use.col = bad.cols(train)
no.use.col = c(1:7, no.use.col)
no.use.col
{% endhighlight %}



{% highlight text %}
##   [1]   1   2   3   4   5   6   7  18  19  21  22  24  25  27  28  29  30
##  [18]  31  32  33  34  35  36  50  51  52  53  54  55  56  57  58  59  75
##  [35]  76  77  78  79  80  81  82  83  93  94  96  97  99 100 103 104 105
##  [52] 106 107 108 109 110 111 112 131 132 134 135 137 138 141 142 143 144
##  [69] 145 146 147 148 149 150  12  13  14  15  16  17  20  23  26  69  70
##  [86]  71  72  73  74  87  88  89  90  91  92  95  98 101 125 126 127 128
## [103] 129 130 133 136 139
{% endhighlight %}
Now I prepare the data by separating out the classification column and removing the unnecessary
columns. Since the classification column will not be used for analysis I remove it.

{% highlight r %}
train.class = as.factor(train$classe)

train = train[, -no.use.col]
train$classe = NULL

test = test[, -no.use.col]
test$problem_id = NULL
{% endhighlight %}
I did everything by hand and didn't use the caret package. Not the smartest way to do things. I am
using PCA to reduce dimensionality. First have to center and rescale the data. The centering and scaling comes from the training data. I use the same centering and rescaling for the test data.

{% highlight r %}
#calculate mean and sds for each column of train
means = colMeans(train)
sds = apply(train, 2, sd)

#center and rescale
train = as.data.frame(t((t(train) - means)/sds))
test = as.data.frame(t((t(test) - means)/sds))

#do PCA
train.prcomp = prcomp(train, center = FALSE)

#predict using PCA
train = as.data.frame(predict(train.prcomp, newdata = train))
test = as.data.frame(predict(train.prcomp, newdata = test))
{% endhighlight %}
I did some analysis to find how many PC's were necessary by splitting the train data into training and validation data. This is probably not a good idea since I calculated means and sd's for the full train set. Should have split the data up top. 

{% highlight r %}
train.cut = train[, c(1:25)] #use only a few of PCA's
train.cut$classe = train.class #add back in classification column

set.seed(1224)
fit = randomForest(classe~., data=train.cut,
               importance = TRUE, ntree = 130)
predictions = predict(fit, newdata = test)
predictions
{% endhighlight %}



{% highlight text %}
##  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 
##  B  A  B  A  A  E  D  B  A  A  B  C  B  A  E  E  A  B  B  B 
## Levels: A B C D E
{% endhighlight %}


