# homework-6
Simple Hello world API uses cluster to balance traffic.
Application is listening 3000 port for http and 3001 for https requests with post method.
If request has payload {"name":"Sample name"}, server returns {"payload":"Hello, Sample name"}. If there is no payload in the
request, server returns {"payload":"Hello, anonymouse"}


