import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const chunkData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(chunkData), 0);
  return Buffer.concat([len, chunkData, crcBuf]);
}

function generatePng(size, filename) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (width * 4 + 1));

  // LinkedIn blue: #0A66C2 -> RGB(10, 102, 194)
  const bgR = 10, bgG = 102, bgB = 194;
  const whiteR = 255, whiteG = 255, whiteB = 255;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Draw stylized "P" icon in center
      const nx = x / width;
      const ny = y / height;

      // Center "B" drawing coordinates
      const isStem = nx >= 0.25 && nx <= 0.38 && ny >= 0.20 && ny <= 0.80;
      const isTopBar = nx >= 0.25 && nx <= 0.68 && ny >= 0.20 && ny <= 0.32;
      const isMidBar = nx >= 0.25 && nx <= 0.65 && ny >= 0.44 && ny <= 0.56;
      const isBotBar = nx >= 0.25 && nx <= 0.70 && ny >= 0.68 && ny <= 0.80;
      const isTopRight = nx >= 0.56 && nx <= 0.70 && ny >= 0.20 && ny <= 0.52;
      const isBotRight = nx >= 0.58 && nx <= 0.72 && ny >= 0.48 && ny <= 0.80;

      const isB = isStem || isTopBar || isMidBar || isBotBar || isTopRight || isBotRight;

      if (isB) {
        rawData[pxOffset] = whiteR;
        rawData[pxOffset + 1] = whiteG;
        rawData[pxOffset + 2] = whiteB;
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = bgR;
        rawData[pxOffset + 1] = bgG;
        rawData[pxOffset + 2] = bgB;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(filename, png);
}

const iconsDir = path.resolve('src/extension/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

generatePng(16, path.join(iconsDir, 'icon-16.png'));
generatePng(48, path.join(iconsDir, 'icon-48.png'));
generatePng(128, path.join(iconsDir, 'icon-128.png'));

console.log('Successfully generated Extension icons (16, 48, 128)');
