/**
 * postal - Pub/Sub library providing wildcard subscriptions, complex message handling, etc.  Works server and client-side.
 * Author: Jim Cowart (http://freshbrewedcode.com/jimcowart)
 * Version: v0.9.0-rc1
 * Url: http://github.com/postaljs/postal.js
 * License(s): MIT, GPL
 */
(function(t,n){"object"==typeof module&&module.exports?module.exports=n(require("lodash"),this):"function"==typeof define&&define.amd?define(["lodash"],function(i){return n(i,t)}):t.postal=n(t._,t)})(this,function(t,n){var i,e=n.postal,o=function(t){if("function"!=typeof t.target)throw new Error("You can only make functions into Conduits.");var n={pre:t.pre||[],post:t.post||[],all:[]},i=t.context,e={isTarget:!0,fn:function(n){var e=Array.prototype.slice.call(arguments,1);t.target.apply(i,e),n.apply(this,e)}},o=function(){n.all=n.pre.concat([e].concat(n.post))};o();var r=function(){var t=0,e=function o(){var e,r=Array.prototype.slice.call(arguments,0),c=t;t+=1,c<n.all.length&&(e=n.all[c],e.fn.apply(e.context||i,[o].concat(r)))};e.apply(this,arguments)};return r.steps=function(){return n.all},r.context=function(t){return 0===arguments.length?i:void(i=t)},r.before=function(t,i){t="function"==typeof t?{fn:t}:t,i=i||{},i.prepend?n.pre.unshift(t):n.pre.push(t),o()},r.after=function(t,i){t="function"==typeof t?{fn:t}:t,i=i||{},i.prepend?n.post.unshift(t):n.post.push(t),o()},r.clear=function(){n={pre:[],post:[],all:[]}},r},r=function(t){this.channel=t||i.configuration.DEFAULT_CHANNEL,this.initialize()};r.prototype.initialize=function(){},r.prototype.subscribe=function(){return i.subscribe({channel:this.channel,topic:1===arguments.length?arguments[0].topic:arguments[0],callback:1===arguments.length?arguments[0].callback:arguments[1]})},r.prototype.publish=function(){var t=1===arguments.length?"[object String]"===Object.prototype.toString.call(arguments[0])?{topic:arguments[0]}:arguments[0]:{topic:arguments[0],data:arguments[1]};t.channel=this.channel,i.publish(t)};var c=function(t,n,i){if(3!==arguments.length)throw new Error("You must provide a channel, topic and callback when creating a SubscriptionDefinition instance.");if(0===n.length)throw new Error("Topics cannot be empty");this.channel=t,this.topic=n,this.subscribe(i)};c.prototype={unsubscribe:function(){this.inactive||(this.inactive=!0,i.unsubscribe(this))},subscribe:function(t){return this.callback=t,this},withContext:function(t){return this.context=t,this}};var s=function(){var n;return function(i){var e=!1;return t.isString(i)?(e=i===n,n=i):(e=t.isEqual(i,n),n=t.clone(i)),!e}},a=function(){var n=[];return function(i){var e=!t.any(n,function(n){return t.isObject(i)||t.isArray(i)?t.isEqual(i,n):i===n});return e&&n.push(i),e}},u={withDelay:function(n){if(t.isNaN(n))throw"Milliseconds must be a number";return{name:"withDelay",fn:function(t,i,e){setTimeout(function(){t(i,e)},n)}}},defer:function(){return this.withDelay(0)},stopAfter:function(n,i){if(t.isNaN(n)||0>=n)throw"The value provided to disposeAfter (maxCalls) must be a number greater than zero.";var e=t.after(n,i);return{name:"stopAfter",fn:function(t,n,i){e(),t(n,i)}}},withThrottle:function(n){if(t.isNaN(n))throw"Milliseconds must be a number";return{name:"withThrottle",fn:t.throttle(function(t,n,i){t(n,i)},n)}},withDebounce:function(n,i){if(t.isNaN(n))throw"Milliseconds must be a number";return{name:"debounce",fn:t.debounce(function(t,n,i){t(n,i)},n,!!i)}},withConstraint:function(n){if(!t.isFunction(n))throw"Predicate constraint must be a function";return{name:"withConstraint",fn:function(t,i,e){n.call(this,i,e)&&t.call(this,i,e)}}},distinct:function(t){t=t||{};var n=function(t){return t[0]},i=t.all?new a(n):new s(n);return{name:"distinct",fn:function(t,n,e){i(n)&&t(n,e)}}}};c.prototype.defer=function(){return this.callback.before(u.defer()),this},c.prototype.disposeAfter=function(t){var n=this;return n.callback.before(u.stopAfter(t,function(){n.unsubscribe.call(n)})),n},c.prototype.distinctUntilChanged=function(){return this.callback.before(u.distinct()),this},c.prototype.distinct=function(){return this.callback.before(u.distinct({all:!0})),this},c.prototype.once=function(){return this.disposeAfter(1),this},c.prototype.withConstraint=function(t){return this.callback.before(u.withConstraint(t)),this},c.prototype.withConstraints=function(t){for(;t.length;)this.callback.before(u.withConstraint(t.shift()));return this},c.prototype.withDebounce=function(t,n){return this.callback.before(u.withDebounce(t,n)),this},c.prototype.withDelay=function(t){return this.callback.before(u.withDelay(t)),this},c.prototype.withThrottle=function(t){return this.callback.before(u.withThrottle(t)),this},c.prototype.subscribe=function(t){return this.callback=new o({target:t,context:this}),this},c.prototype.withContext=function(t){return this.callback.context(t),this},c.prototype.after=function(){this.callback.after.apply(this,arguments)},c.prototype.before=function(){this.callback.before.apply(this,arguments)},r.prototype.initialize=function(){var t=this.publish;this.publish=new o({target:t,context:this})};var h={cache:{},regex:{},compare:function(n,i){var e,o,r,c=this.cache[i]&&this.cache[i][n];return"undefined"!=typeof c?c:((o=this.regex[n])||(e="^"+t.map(n.split("."),function(t){var n="";return r&&(n="#"!==r?"\\.\\b":"\\b"),n+="#"===t?"[\\s\\S]*":"*"===t?"[^.]+":t,r=t,n}).join("")+"$",o=this.regex[n]=new RegExp(e)),this.cache[i]=this.cache[i]||{},this.cache[i][n]=c=o.test(i),c)},reset:function(){this.cache={},this.regex={}}},p=function(t,n){!t.inactive&&i.configuration.resolver.compare(t.topic,n.topic)&&t.callback.call(t.context||this,n.data,n)},l=0,f=[],b=function(){for(;f.length;)i.unsubscribe(f.shift())};if(i={configuration:{resolver:h,DEFAULT_CHANNEL:"/",SYSTEM_CHANNEL:"postal"},subscriptions:{},wireTaps:[],ChannelDefinition:r,SubscriptionDefinition:c,channel:function(t){return new r(t)},subscribe:function(t){var n,i=new c(t.channel||this.configuration.DEFAULT_CHANNEL,t.topic,t.callback),e=this.subscriptions[i.channel];return this.publish({channel:this.configuration.SYSTEM_CHANNEL,topic:"subscription.created",data:{event:"subscription.created",channel:i.channel,topic:i.topic}}),e||(e=this.subscriptions[i.channel]={}),n=this.subscriptions[i.channel][i.topic],n||(n=this.subscriptions[i.channel][i.topic]=[]),n.push(i),i},publish:function(n){++l,n.channel=n.channel||this.configuration.DEFAULT_CHANNEL,n.timeStamp=new Date,t.each(this.wireTaps,function(t){t(n.data,n)}),this.subscriptions[n.channel]&&t.each(this.subscriptions[n.channel],function(t){for(var i,e=0,o=t.length;o>e;)(i=t[e++])&&p(i,n)}),0===--l&&b()},unsubscribe:function(t){if(l)return void f.push(t);if(this.subscriptions[t.channel]&&this.subscriptions[t.channel][t.topic])for(var n=this.subscriptions[t.channel][t.topic].length,i=0;n>i;){if(this.subscriptions[t.channel][t.topic][i]===t){this.subscriptions[t.channel][t.topic].splice(i,1);break}i+=1}this.publish({channel:this.configuration.SYSTEM_CHANNEL,topic:"subscription.removed",data:{event:"subscription.removed",channel:t.channel,topic:t.topic}})},addWireTap:function(t){var n=this;return n.wireTaps.push(t),function(){var i=n.wireTaps.indexOf(t);-1!==i&&n.wireTaps.splice(i,1)}},noConflict:function(){if("undefined"==typeof window||"undefined"!=typeof window&&"function"==typeof define&&define.amd)throw new Error("noConflict can only be used in browser clients which aren't using AMD modules");return n.postal=e,this},getSubscribersFor:function(){var t=arguments[0],n=arguments[1];return 1===arguments.length&&(t=arguments[0].channel||this.configuration.DEFAULT_CHANNEL,n=arguments[0].topic),this.subscriptions[t]&&Object.prototype.hasOwnProperty.call(this.subscriptions[t],n)?this.subscriptions[t][n]:[]},reset:function(){this.subscriptions&&(t.each(this.subscriptions,function(n){t.each(n,function(t){for(;t.length;)t.pop().unsubscribe()})}),this.subscriptions={}),this.configuration.resolver.reset()}},i.subscriptions[i.configuration.SYSTEM_CHANNEL]={},i.linkChannels=function(n,i){var e=[],o=this;return n=t.isArray(n)?n:[n],i=t.isArray(i)?i:[i],t.each(n,function(n){var r=n.topic||"#";t.each(i,function(i){var c=i.channel||o.configuration.DEFAULT_CHANNEL;e.push(o.subscribe({channel:n.channel||o.configuration.DEFAULT_CHANNEL,topic:r,callback:function(n,e){var r=t.clone(e);r.topic=t.isFunction(i.topic)?i.topic(e.topic):i.topic||e.topic,r.channel=c,r.data=n,o.publish(r)}}))})}),e},n&&Object.prototype.hasOwnProperty.call(n,"__postalReady__")&&t.isArray(n.__postalReady__))for(;n.__postalReady__.length;)n.__postalReady__.shift().onReady(i);return i});