const sharp = require('sharp');
const fs = require('fs');
const express = require('express');
const QrCode = require('qrcode');
const template = require('lodash.template');
const fileType = require('file-type');
const axios = require('axios');
const NodeCache = require('node-cache');
const app = express();
const port = process.env.PORT || 3000;
const myCache = new NodeCache();
const config = require('./config');

// TODO validate config

config.map(item => {
  const svgContent = fs.readFileSync(item.svg, 'utf8');
  const svgCompile = template(svgContent);
  app.get('/' + item.name, (req, res) => {
    handle(item, svgCompile, req, res).catch(err => {
      console.log(`Fail to handle ${req.url}, ${err.stack}`)
      res.status(400);
      res.end(err.message);
    })
  });
});

app.listen(port, '0.0.0.0', () => console.log(`Listening on port ${port}!`));

async function handle(item, svgCompile, req, res) {
  const data = {};
  const { query } = req;
  for (const v of item.vars) {
    const { name, kind, defaultValue, cache } = v;
    let value = query[name] || defaultValue;
    if (!value) {
      throw new Error(`Querystring ${name} is required`);
    }
    if (kind === 'qr') {
      value = await QrCode.toDataURL(value);
    } else if (kind === 'image') {
      value = await wrapInCache(item.name + '.' + name, cache, () => fetchImage(value));
    }
    data[name] = value;
  }
  const compiledSvg = svgCompile(data);
  const pngData = await sharp(Buffer.from(compiledSvg)).png().toBuffer();;
  res.set('content-type', 'image/png');
  res.end(pngData);
}

async function fetchImage(imageUrl) {
  const res = await axios.get(imageUrl, {
    timeout: 10000,
    responseType: 'arraybuffer',
  });
  const buffer = res.data;
  const type = fileType(buffer);
  return `data:${type.mime};base64,${buffer.toString('base64')}`
}

async function wrapInCache(key, ttl, fn) {
  const cachedValue = myCache.get(key);
  if (cachedValue) {
    return cachedValue;
  }
  const value = await fn();
  if (ttl) {
    myCache.set(key, value, ttl);
  }
  return value;
}