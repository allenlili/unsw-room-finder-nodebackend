FROM node:6.11.2

# install nginx
RUN apt-get update \
 && apt-get install -y --force-yes nginx

# install watchman
RUN apt-get update \
 && apt-get install -y --force-yes \
      autotools-dev automake m4 checkinstall libssl-dev python-dev python3-dev \
 && git clone https://github.com/facebook/watchman.git \
 && cd watchman \
 && git checkout v4.7.0 \
 && ./autogen.sh \
 && ./configure \
 && make \
 && make install

# put all the application code in a directory
# called /application at the root of the file system
COPY ./ /application/
WORKDIR application/

RUN make node_modules
RUN make flow-typed

EXPOSE 8080 443

CMD ["node", "./src/app/app.js"]
