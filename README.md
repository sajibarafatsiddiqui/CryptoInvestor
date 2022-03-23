# CryptoInvestor
Get Portfolio Value from Big CSV file

Get Portfolio Value from Big CSV file

A file stream has been created to read the big csv file . Highland a high level stream library has been used here with different promises like filter to filter data depending on the parameter chosen.

fs has been used to read the file and csv-parser has been used to parse csv. I have used four function namely first(), second() , third () , fourth() to satisfy four requirements respectively. Also two do calculations other functions has been written.

1) To get portfolio per token : node app
2) To get portfolio for given token : node app --token='token name'
3) To get portfolio value per token for given date:node app --date='date'
4) To get portfolio vaule for given date and token: node app --token='token name' --date='date'
Thanks
