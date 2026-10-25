const target=new URL('academy.html',location.href);
target.search=location.search;
target.hash=location.hash;
location.replace(target.href);
