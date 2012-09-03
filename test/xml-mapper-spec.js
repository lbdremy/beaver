/**
 * Modules dependencies
 */

var spec = require('stream-spec'),
	tester = require('stream-tester'),
	fs = require('fs'),
	xmlMapper = require('./../lib/beaver/streams/xml-mapper');

var options = {
    main : '/merchandiser/product',
    map : {
          '/merchandiser/product[@product_id]': { 'to' : 'id', 'format' : 'md5DigestHex' },
          '/merchandiser/product[@name]': 'title',
          '/merchandiser/product/description/short': 'description',
          '/merchandiser/product/price/retail' : 'price',
          '/merchandiser/product/price[@currency]' : 'currency',
          '/merchandiser/product/URL/product' : 'url',
          '/merchandiser/product/URL/productImage' : 'image1',
          '/merchandiser/product/category/primary' : 'category',
          '/merchandiser/product/category/secondary' : 'category_merchant_t',
          'copied_merchant_id' : { 'to' : 'merchant_id_t', copy : 'affiliate_name_t,merchant_name_t', 'format' : 'md5DigestHex' },
          '/merchandiser/header/merchantName' : { 'to' : 'merchant_name_t', 'common' : true },
          '/merchandiser/product/upc' : 'upc_t',
          'default_affiliate_name' : { 'to' : 'affiliate_name_t', 'default' : 'Linkshare' },
          'default_country' : { to : 'country_t', default : 'GB'}
      }  
};
var stream = xmlMapper.createStream(options);


spec(stream)
	.through({ strict : true , error : false })
	.validateOnExit();

var i = 0;
tester.createRandomStream(function(){
	var b;
	if(i === 0){
		b = new Buffer('<?xml version="1.0" encoding="UTF-8"?><merchandiser xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="merchandiser.xsd"><header><merchantId>35269</merchantId><merchantName>Cult Beauty Ltd.</merchantName><createdOn>2012-09-03/14:53:58</createdOn></header>','utf-8');
	}else{
		b = new Buffer('<product product_id="1117' + i +'" name="Intensive Vitamine C Cream" sku_number="IST015" manufacturer_name="" part_number=""><category><primary>Skin Care</primary><secondary>Anti-ageing~~Cult Beauty~~Moisturisers</secondary></category><URL><product>http://click.linksynergy.com/link?id=y6hqZAFw7vI&amp;offerid=172711.1117&amp;type=15&amp;murl=http%3A%2F%2Fwww.cultbeauty.co.uk%2Finstitut-esthederm-intensive-vitamine-c-cream-jar.html</product><productImage>http://www.cultbeauty.co.uk/media/catalog/product/cache/1/image/265x/9df78eab33525d08d6e5fb8d27136e95/v/2/v245100_institutesthederm_intensifvitamineccream_50ml_sizedproduct_800x960.jpg</productImage><buy></buy></URL><description><short>This triple action daily moisturising cream contains a hefty dose of concentrated Vitamin C to effectively tackle dark spots/hyperpigmentation, wrinkl</short><long>This triple action daily moisturising cream contains a hefty dose of concentrated Vitamin C to effectively tackle dark spots/hyperpigmentation, wrinkles and loss of firmness, while delivering some serious protection against ageing free radical scavengers. Collagen synthesis is also stimulated, so skin feels firmer, more supple and radiant. Institut Esthederm have spent 20 years researching how to deliver such a powerful concentration of Vitamin C in a stable, bio-available form.</long></description><discount currency="GBP"><amount></amount><type>amount</type></discount><price currency="GBP"><sale begin_date="" end_date=""></sale><retail>64.00</retail></price><brand></brand><shipping><cost currency="GBP"><amount></amount><currency>GBP</currency></cost><information></information><availability>In Stock</availability></shipping><keywords>Institut Esthederm Intensive Vitamine C Cream, 50ml, Skin Care, , </keywords><upc></upc><m1></m1><pixel>http://ad.linksynergy.com/fs-bin/show?id=y6hqZAFw7vI&amp;bids=172711.1117&amp;type=15&amp;subid=0</pixel></product>','utf-8')
	}
	i++;
	return b;
},1000)
	.pipe(stream)
	.on('data',function(data){
		console.log(data);
	})
	.on('error',function(err){
		console.error(err);
	})
	.pipe(tester.createPauseStream());