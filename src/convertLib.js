var ttf = require('./ttf');
var ByteBuffer = require('microbuffer');
var zlib = require('zlib');

function ulong(t) {
	/*jshint bitwise:false*/
	t &= 0xffffffff;
	if (t < 0) {
		t += 0x100000000;
	}
	return t;
}

function longAlign(n) {
	/*jshint bitwise:false*/
	return (n + 3) & ~3;
}

function calc_checksum(buf) {
	var sum = 0;
	var nlongs = buf.length / 4;

	for (var i = 0; i < nlongs; ++i) {
		var t = buf.getUint32(i * 4);

		sum = ulong(sum + t);
	}
	return sum;
}

/**
 * Offsets in EOT file structure. Refer to EOTPrefix in OpenTypeUtilities.cpp
 */
var EOT_OFFSET = {
	LENGTH: 0,
	FONT_LENGTH: 4,
	VERSION: 8,
	CHARSET: 26,
	MAGIC: 34,
	FONT_PANOSE: 16,
	ITALIC: 27,
	WEIGHT: 28,
	UNICODE_RANGE: 36,
	CODEPAGE_RANGE: 52,
	CHECKSUM_ADJUSTMENT: 60
};

var WOFF_OFFSET = {
	MAGIC: 0,
	FLAVOR: 4,
	SIZE: 8,
	NUM_TABLES: 12,
	RESERVED: 14,
	SFNT_SIZE: 16,
	VERSION_MAJ: 20,
	VERSION_MIN: 22,
	META_OFFSET: 24,
	META_LENGTH: 28,
	META_ORIG_LENGTH: 32,
	PRIV_OFFSET: 36,
	PRIV_LENGTH: 40
};

var WOFF_ENTRY_OFFSET = {
	TAG: 0,
	OFFSET: 4,
	COMPR_LENGTH: 8,
	LENGTH: 12,
	CHECKSUM: 16
};

/**
 * Offsets in different SFNT (TTF) structures. See OpenTypeUtilities.cpp
 */
var SFNT_OFFSET = {
	// sfntHeader:
	NUMTABLES: 4,

	// TableDirectoryEntry
	TABLE_TAG: 0,
	TABLE_OFFSET: 8,
	TABLE_LENGTH: 12,

	// OS2Table
	OS2_WEIGHT: 4,
	OS2_FONT_PANOSE: 32,
	OS2_UNICODE_RANGE: 42,
	OS2_FS_SELECTION: 62,
	OS2_CODEPAGE_RANGE: 78,

	// headTable
	HEAD_CHECKSUM_ADJUSTMENT: 8,

	// nameTable
	NAMETABLE_FORMAT: 0,
	NAMETABLE_COUNT: 2,
	NAMETABLE_STRING_OFFSET: 4,

	// nameRecord
	NAME_PLATFORM_ID: 0,
	NAME_ENCODING_ID: 2,
	NAME_LANGUAGE_ID: 4,
	NAME_NAME_ID: 6,
	NAME_LENGTH: 8,
	NAME_OFFSET: 10
};

var SFNT_OFFSETWOFF = {
	TAG: 0,
	CHECKSUM: 4,
	OFFSET: 8,
	LENGTH: 12
};

var SFNT_ENTRY_OFFSETWOFF = {
	FLAVOR: 0,
	VERSION_MAJ: 4,
	VERSION_MIN: 6,
	CHECKSUM_ADJUSTMENT: 8
};

/**
 * Sizes of structures
 */
var SIZEOF = {
	SFNT_TABLE_ENTRY: 16,
	SFNT_HEADER: 12,
	SFNT_NAMETABLE: 6,
	SFNT_NAMETABLE_ENTRY: 12,
	EOT_PREFIX: 82
};

var SIZEOFWOFF = {
	WOFF_HEADER: 44,
	WOFF_ENTRY: 20,
	SFNT_HEADER: 12,
	SFNT_TABLE_ENTRY: 16
};

/**
 * Magic numbers
 */
var MAGIC = {
	EOT_VERSION: 0x00020001,
	EOT_MAGIC: 0x504c,
	EOT_CHARSET: 1,
	LANGUAGE_ENGLISH: 0x0409
};

var MAGICWOFF = {
	WOFF: 0x774F4646,
	CHECKSUM_ADJUSTMENT: 0xB1B0AFBA
};

/**
 * Utility function to convert buffer of utf16be chars to buffer of utf16le
 * chars prefixed with length and suffixed with zero
 */
function strbuf(str) {
	var b = new ByteBuffer(str.length + 4);

	b.setUint16(0, str.length, true);

	for (var i = 0; i < str.length; i += 2) {
		b.setUint16(i + 2, str.getUint16(i), true);
	}

	b.setUint16(b.length - 2, 0, true);

	return b;
}

module.exports = convertLib;

function convertLib(file) {

	this.file = file;
	this.glyphs = [];
	this.meta = null;

	this._init();

}

convertLib.prototype._init = function () {

	var font = ttf(this.file);

	this.meta = font.getMeta();

	this.meta.head = font.head;
	this.meta.hhea = font.hhea;

	this.glyphs = font.getCodeAndGlyph(0);

};

convertLib.prototype.renderByTmpl = function (_tmpl) {
	var glyphArray = '';

	for (var idx = 0; idx < this.glyphs.length; idx++) {
		glyphArray += `\n            <glyph glyph-name="${this.glyphs[idx].name}" unicode="${this.glyphs[idx].unicode}" horiz-adv-x="${this.glyphs[idx].boundingBox.upX}" d="${this.glyphs[idx].path}"/>`;
	}

	var template = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >
<svg xmlns="http://www.w3.org/2000/svg">
	<defs>
		<font id="${this.meta['Postscript name']}">
			<font-face font-family="${this.meta['Font family']}"
					   units-per-em="${this.meta.head.unitsPerEm}"
					   ascent="${this.meta.hhea.ascender}"
					   descent="${this.meta.hhea.descender}"
					   bbox="${this.meta.head.xMin} ${this.meta.head.yMin} ${this.meta.head.xMax} ${this.meta.head.yMax}"
					/>
			<missing-glyph horiz-adv-x="0" />
			${glyphArray}
		</font>
	</defs>
</svg>
`;
	return template;
};

convertLib.prototype.ttf2eot = function (arr) {
	var buf = new ByteBuffer(arr);
	var out = new ByteBuffer(SIZEOF.EOT_PREFIX),
		i, j;

	out.fill(0);
	out.setUint32(EOT_OFFSET.FONT_LENGTH, buf.length, true);
	out.setUint32(EOT_OFFSET.VERSION, MAGIC.EOT_VERSION, true);
	out.setUint8(EOT_OFFSET.CHARSET, MAGIC.EOT_CHARSET);
	out.setUint16(EOT_OFFSET.MAGIC, MAGIC.EOT_MAGIC, true);

	var familyName = [],
		subfamilyName = [],
		fullName = [],
		versionString = [];

	var haveOS2 = false,
		haveName = false,
		haveHead = false;

	var numTables = buf.getUint16(SFNT_OFFSET.NUMTABLES);

	for (i = 0; i < numTables; ++i) {
		var data = new ByteBuffer(buf, SIZEOF.SFNT_HEADER + i * SIZEOF.SFNT_TABLE_ENTRY);
		var tableEntry = {
			tag: data.toString(SFNT_OFFSET.TABLE_TAG, 4),
			offset: data.getUint32(SFNT_OFFSET.TABLE_OFFSET),
			length: data.getUint32(SFNT_OFFSET.TABLE_LENGTH)
		};

		var table = new ByteBuffer(buf, tableEntry.offset, tableEntry.length);

		if (tableEntry.tag === 'OS/2') {
			haveOS2 = true;

			for (j = 0; j < 10; ++j) {
				out.setUint8(EOT_OFFSET.FONT_PANOSE + j, table.getUint8(SFNT_OFFSET.OS2_FONT_PANOSE + j));
			}

			/*jshint bitwise:false */
			out.setUint8(EOT_OFFSET.ITALIC, table.getUint16(SFNT_OFFSET.OS2_FS_SELECTION) & 0x01);
			out.setUint32(EOT_OFFSET.WEIGHT, table.getUint16(SFNT_OFFSET.OS2_WEIGHT), true);

			for (j = 0; j < 4; ++j) {
				out.setUint32(EOT_OFFSET.UNICODE_RANGE + j * 4, table.getUint32(SFNT_OFFSET.OS2_UNICODE_RANGE + j * 4), true);
			}

			for (j = 0; j < 2; ++j) {
				out.setUint32(EOT_OFFSET.CODEPAGE_RANGE + j * 4, table.getUint32(SFNT_OFFSET.OS2_CODEPAGE_RANGE + j * 4), true);
			}

		} else if (tableEntry.tag === 'head') {

			haveHead = true;
			out.setUint32(EOT_OFFSET.CHECKSUM_ADJUSTMENT, table.getUint32(SFNT_OFFSET.HEAD_CHECKSUM_ADJUSTMENT), true);

		} else if (tableEntry.tag === 'name') {

			haveName = true;

			var nameTable = {
				format: table.getUint16(SFNT_OFFSET.NAMETABLE_FORMAT),
				count: table.getUint16(SFNT_OFFSET.NAMETABLE_COUNT),
				stringOffset: table.getUint16(SFNT_OFFSET.NAMETABLE_STRING_OFFSET)
			};

			for (j = 0; j < nameTable.count; ++j) {
				var nameRecord = new ByteBuffer(table, SIZEOF.SFNT_NAMETABLE + j * SIZEOF.SFNT_NAMETABLE_ENTRY);
				var name = {
					platformID: nameRecord.getUint16(SFNT_OFFSET.NAME_PLATFORM_ID),
					encodingID: nameRecord.getUint16(SFNT_OFFSET.NAME_ENCODING_ID),
					languageID: nameRecord.getUint16(SFNT_OFFSET.NAME_LANGUAGE_ID),
					nameID: nameRecord.getUint16(SFNT_OFFSET.NAME_NAME_ID),
					length: nameRecord.getUint16(SFNT_OFFSET.NAME_LENGTH),
					offset: nameRecord.getUint16(SFNT_OFFSET.NAME_OFFSET)
				};

				if (name.platformID === 3 && name.encodingID === 1 && name.languageID === MAGIC.LANGUAGE_ENGLISH) {
					var s = strbuf(new ByteBuffer(table, nameTable.stringOffset + name.offset, name.length));

					switch (name.nameID) {
						case 1:
							familyName = s;
							break;
						case 2:
							subfamilyName = s;
							break;
						case 4:
							fullName = s;
							break;
						case 5:
							versionString = s;
							break;
					}
				}
			}
			// familyName = this.meta['Font family'];
			// subfamilyName = this.meta['Font subfamily'];
			// fullName = this.meta['Full name'];
			// versionString = this.meta['Version'];
		}
		if (haveOS2 && haveName && haveHead) {
			break;
		}
	}

	if (!(haveOS2 && haveName && haveHead)) {
		throw new Error('Required section not found');
	}

	// Calculate final length
	var len =
		out.length +
		familyName.length +
		subfamilyName.length +
		versionString.length +
		fullName.length +
		2 +
		buf.length;

	// Create final buffer with the the same array type as input one.
	var eot = new ByteBuffer(len);

	eot.writeBytes(out.buffer);
	eot.writeBytes(familyName.buffer);
	eot.writeBytes(subfamilyName.buffer);
	eot.writeBytes(versionString.buffer);
	eot.writeBytes(fullName.buffer);
	eot.writeBytes([0, 0]);
	eot.writeBytes(buf.buffer);

	eot.setUint32(EOT_OFFSET.LENGTH, len, true); // Calculate overall length

	return eot;
}

convertLib.prototype.ttf2woff = function (arr) {
	var buf = new ByteBuffer(arr);

	// options = options || {};

	var version = {
		maj: 0,
		min: 1
	};
	var numTables = buf.getUint16(4);
	//var sfntVersion = buf.getUint32 (0);
	var flavor = 0x10000;

	var woffHeader = new ByteBuffer(SIZEOFWOFF.WOFF_HEADER);

	woffHeader.setUint32(WOFF_OFFSET.MAGICWOFF, MAGICWOFF.WOFF);
	woffHeader.setUint16(WOFF_OFFSET.NUM_TABLES, numTables);
	woffHeader.setUint16(WOFF_OFFSET.RESERVED, 0);
	woffHeader.setUint32(WOFF_OFFSET.SFNT_SIZE, 0);
	woffHeader.setUint32(WOFF_OFFSET.META_OFFSET, 0);
	woffHeader.setUint32(WOFF_OFFSET.META_LENGTH, 0);
	woffHeader.setUint32(WOFF_OFFSET.META_ORIG_LENGTH, 0);
	woffHeader.setUint32(WOFF_OFFSET.PRIV_OFFSET, 0);
	woffHeader.setUint32(WOFF_OFFSET.PRIV_LENGTH, 0);

	var entries = [];

	var i, tableEntry;

	for (i = 0; i < numTables; ++i) {
		var data = new ByteBuffer(buf.buffer, SIZEOFWOFF.SFNT_HEADER + i * SIZEOFWOFF.SFNT_TABLE_ENTRY);

		tableEntry = {
			Tag: new ByteBuffer(data, SFNT_OFFSETWOFF.TAG, 4),
			checkSum: data.getUint32(SFNT_OFFSETWOFF.CHECKSUM),
			Offset: data.getUint32(SFNT_OFFSETWOFF.OFFSET),
			Length: data.getUint32(SFNT_OFFSETWOFF.LENGTH)
		};
		entries.push(tableEntry);
	}
	entries = entries.sort(function (a, b) {
		var aStr = a.Tag.toString();
		var bStr = b.Tag.toString();

		return aStr === bStr ? 0 : aStr < bStr ? -1 : 1;
	});

	var offset = SIZEOFWOFF.WOFF_HEADER + numTables * SIZEOFWOFF.WOFF_ENTRY;
	var woffSize = offset;
	var sfntSize = SIZEOFWOFF.SFNT_HEADER + numTables * SIZEOFWOFF.SFNT_TABLE_ENTRY;

	var tableBuf = new ByteBuffer(numTables * SIZEOFWOFF.WOFF_ENTRY);

	for (i = 0; i < numTables; ++i) {
		tableEntry = entries[i];

		if (tableEntry.Tag.toString() !== 'head') {
			var algntable = new ByteBuffer(buf.buffer, tableEntry.Offset, longAlign(tableEntry.Length));

			if (calc_checksum(algntable) !== tableEntry.checkSum) {
				throw 'Checksum error in ' + tableEntry.Tag.toString();
			}
		}

		tableBuf.setUint32(i * SIZEOFWOFF.WOFF_ENTRY + WOFF_ENTRY_OFFSET.TAG, tableEntry.Tag.getUint32(0));
		tableBuf.setUint32(i * SIZEOFWOFF.WOFF_ENTRY + WOFF_ENTRY_OFFSET.LENGTH, tableEntry.Length);
		tableBuf.setUint32(i * SIZEOFWOFF.WOFF_ENTRY + WOFF_ENTRY_OFFSET.CHECKSUM, tableEntry.checkSum);
		sfntSize += longAlign(tableEntry.Length);
	}

	var sfntOffset = SIZEOFWOFF.SFNT_HEADER + entries.length * SIZEOFWOFF.SFNT_TABLE_ENTRY;
	var csum = calc_checksum(new ByteBuffer(buf.buffer, 0, SIZEOFWOFF.SFNT_HEADER));

	for (i = 0; i < entries.length; ++i) {
		tableEntry = entries[i];

		var b = new ByteBuffer(SIZEOFWOFF.SFNT_TABLE_ENTRY);

		b.setUint32(SFNT_OFFSETWOFF.TAG, tableEntry.Tag.getUint32(0));
		b.setUint32(SFNT_OFFSETWOFF.CHECKSUM, tableEntry.checkSum);
		b.setUint32(SFNT_OFFSETWOFF.OFFSET, sfntOffset);
		b.setUint32(SFNT_OFFSETWOFF.LENGTH, tableEntry.Length);
		sfntOffset += longAlign(tableEntry.Length);
		csum += calc_checksum(b);
		csum += tableEntry.checkSum;
	}

	var checksumAdjustment = ulong(MAGICWOFF.CHECKSUM_ADJUSTMENT - csum);

	var len, woffDataChains = [];

	for (i = 0; i < entries.length; ++i) {
		tableEntry = entries[i];

		var sfntData = new ByteBuffer(buf.buffer, tableEntry.Offset, tableEntry.Length);

		if (tableEntry.Tag.toString() === 'head') {
			version.maj = sfntData.getUint16(SFNT_ENTRY_OFFSETWOFF.VERSION_MAJ);
			version.min = sfntData.getUint16(SFNT_ENTRY_OFFSETWOFF.VERSION_MIN);
			flavor = sfntData.getUint32(SFNT_ENTRY_OFFSETWOFF.FLAVOR);
			sfntData.setUint32(SFNT_ENTRY_OFFSETWOFF.CHECKSUM_ADJUSTMENT, checksumAdjustment);
		}

		var res = zlib.deflateSync(sfntData.toArray());

		var compLength;

		// We should use compression only if it really save space (standard requirement).
		// Also, data should be aligned to long (with zeros?).
		compLength = Math.min(res.length, sfntData.length);
		len = longAlign(compLength);

		var woffData = new ByteBuffer(len);

		woffData.fill(0);

		if (res.length >= sfntData.length) {
			woffData.writeBytes(sfntData.toArray());
		} else {
			woffData.writeBytes(res);
		}

		tableBuf.setUint32(i * SIZEOFWOFF.WOFF_ENTRY + WOFF_ENTRY_OFFSET.OFFSET, offset);

		offset += woffData.length;
		woffSize += woffData.length;

		tableBuf.setUint32(i * SIZEOFWOFF.WOFF_ENTRY + WOFF_ENTRY_OFFSET.COMPR_LENGTH, compLength);

		woffDataChains.push(woffData);
	}

	woffHeader.setUint32(WOFF_OFFSET.SIZE, woffSize);
	woffHeader.setUint32(WOFF_OFFSET.SFNT_SIZE, sfntSize);
	woffHeader.setUint16(WOFF_OFFSET.VERSION_MAJ, version.maj);
	woffHeader.setUint16(WOFF_OFFSET.VERSION_MIN, version.min);
	woffHeader.setUint32(WOFF_OFFSET.FLAVOR, flavor);

	var out = new ByteBuffer(woffSize);

	out.writeBytes(woffHeader.buffer);
	out.writeBytes(tableBuf.buffer);

	for (i = 0; i < woffDataChains.length; i++) {
		out.writeBytes(woffDataChains[i].buffer);
	}

	return out;
}