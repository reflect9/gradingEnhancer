/*
 * Copyright (c) 2010 The Chromium Authors. All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 */
chrome.extension.sendRequest({}, function(response) {});
/*
 * Checks the URL or other property of the current web page and run allowed function
 */
function main() {
	// FEATURE 1. REVIEW button at STUDENt LIST PAGE
	// condition: URL contains 'instructor' keyword
	// add 'review' buttons next to last submission date for directly going to review page
	if (location.href.indexOf('instructor')>-1) {
		var table_submissions = $("table:contains('last submission')");
		var td_list = $(table_submissions).find("tr").find("td:nth-child(6)");
		$.each(td_list,function(tdi,td) {
			var atag = $(td).find("a")[0];
			if(!atag) return;
			var url = atag.href;
			var directUrlToReview = url.replace("instructor/submission.jsp","codeReview/index.jsp");
			$(td).prepend("<a href='"+directUrlToReview+"' target='_blank'>REVIEW__</a>");
		});
	}
	// FEATURE 2. CHECK CODE STYLES
	// condition: URL contains 'codeReview' keyword
	// it checks several heuristic rules for code style and shows summary for each of them
	if (location.href.indexOf('codeReview')>-1) {
		// first, create summary UIPanel
		var UIpanel = document.createElement('div');
		UIpanel.setAttribute('class','UIpanel');
		document.body.appendChild(UIpanel);
		// check if it's the right course
		if($("h1").text().match(/cs131/i)) {
			// check if it's the right project
			if($("h1").text().match(/Project1/i)) cs131project1(UIpanel);
			else if($("h1").text().match(/Project2/i)) cs131project2(UIpanel);
			else if($("h1").text().match(/Project3/i)) cs131project3(UIpanel);
		} else if($("h1").text().match(/cs433/i)) {
			if($("h1").text().match(/ /i)) cs433project(UIpanel);
		}
	}	// END OF FEATURE 2. CHECK CODE STYLES

	// assign click event to predefined comment buttons
	$(".tip").click(function() {
		eventFire($(this).parent()[0],'dblclick');
		var self =this;
		setTimeout(function() {
			$(self).parent().parent().find("input[type='checkbox']").prop("checked",false);
			var textBox = $(self).parent().parent().find("textarea[aria-hidden='false']");
			$(textBox).val($(self).attr('msg'));
			//$(self).parent().parent().find("textarea[aria-hidden='false']").focus().select();
			eventFire($(textBox).parent().find("a:contains('Save')")[0],'click');
		},500);
	});


} // MAIN ENDS

function cs433project(UIPanel) {
	// 1. modify the line below to specify single/multiple section titles to look up
	var sectionsStudentModified = ["p3_student/PhotoTools.java"];

	var tr_codes = _.reduce(sectionsStudentModified, function(memo,sec){
		var tr_list = $("div.GMYHEHOCNK:contains('"+sec+"')").parent().find("tr");
		return _.union(memo,tr_list);
	},[]);
	paneToScroll = $(".GMYHEHOCJK");
	tr_codes = tr_codes[0];
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 0. FINDING  WORDS
	///////////////////////////////////////////////////////////////////////////////////////////////////
	var wordsToFind = ["sleep","wait","notify","synchronized","ReentrantLock"];
	var wordsFound = [];
	// iterates each line of code below
	$.each(tr_codes,function(tri,tr) {
		var codeDiv = $(tr).find("div.gwt-Label")[0];
		var codeText = $(codeDiv).text();
		var wordsFoundInCodeText = _.filter(wordsToFind, function(w) { return codeText.match(w); });
		// if wordsFoundInCodeText=['sleep','wait'], it means the code line contains sleep and wait words. 
		// let's do some actions (delete unwanted options)
		// option 1. adding comment button
		btn_addComment(tr,"button title","predefined comment.","yello");
		// option 2. simply adding comment 
		addCommentOnly(tr,"comment message","green");
		// option 3. count or remember something to show in summary UI panel
		// for example, you can update a list of unique words found so far
		wordsFound = _.unique(_.union(wordsFound, wordsFoundInCodeText));
	});  // end of code line iteration
	// it's time to show the summary in the UIPanel 
	$(UIpanel).append("<h3 style='color:plum'>FINDING WORDS</h3>");
	$(UIpanel).append("<p>any descriptive text here.</p>");
	$(UIpanel).append("<p>[WORDS FOUND] "+ makeLabels(wordsFound).join(" ")   +"</p>");
	// END OF RUBRIC 0.
}

function cs131project3(UIpanel) {
	// second, find a list <tr>tags containing codes
	var sectionsStudentModified = ["p3_student/PhotoTools.java"];
	var tr_codes = _.reduce(sectionsStudentModified, function(memo,sec){
		var tr_list = $("div.GMYHEHOCNK:contains('"+sec+"')").parent().find("tr");
		return _.union(memo,tr_list);
	},[]);
	paneToScroll = $(".GMYHEHOCJK");
	// eventFire($("a:contains('"+sectionsStudentModified[0]+"')")[0],'click');
	tr_codes = tr_codes[0];	// flatten for 1-level to get <tr> for each codeline
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 0. Proper indenting
	///////////////////////////////////////////////////////////////////////////////////////////////////
	$(UIpanel).append("<h3 style='color:plum'>Proper Indenting</h3>");
	$(UIpanel).append("<p>-1 for small mistakes <br> -2 for lack of effort</p>");
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 1. good variable names
	///////////////////////////////////////////////////////////////////////////////////////////////////
	var loopVars = [];  generalVars = []; rowColMisuses = [];   whitelist = ['row','col','x','y'];
	var tokens_java_types = ["int","String","boolean","Scanner"];  // list of type tokens for finding variable names (should be added for later projects)
	//var regex_declaration = /^\s*(final)?\s*(static)?\s*((int)|(String)|(boolean)|(Scanner)) .*/g;
	var regex_declaration = /\s*((int)|(String)|(boolean)|(Scanner))\s[A-Za-z0-9]+\s*(=|;)/g;
	var regex_camelcase = /[a-z]([A-Z0-9][a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])*[A-Za-z0-9]*/g;
	$.each(tr_codes,function(tri,tr) {
		var codeDiv = $(tr).find("div.gwt-Label")[0];
		var codeText = $(codeDiv).text();
		if(!codeText) return;
		// actual test of the code string
		var statements = codeText.split(";");
		$.each(statements, function(ddi,st) { // per statements in one line
			var dl = st.match(regex_declaration);
			if(dl==null) return;
			// there could be multiple declarations in one line, so we use $.each
			$.each(dl, function(di,d) {
				var varNames = d.replace(/int/gi,"");
				var namesList = varNames.split(",");
				$.each(namesList, function(ni,name) {
					var varName = $.trim(name.replace(/=.*$/ig,""));
					if(varName.length<3 && whitelist.indexOf(varName)==-1)
							btn_addComment(tr,"Variable Used: "+varName,"Non-descriptive Variable Names : "+varName +" is not descriptive of its purpose","yellow");
					// loop vars
					if(codeText.match(/((for)|(while))/i)) {
						loopVars.push(varName);
						if(		(codeText.match(/width/i) && varName=="row")
							||	(codeText.match(/height/i) && varName=="col")
						) btn_addComment(tr,"row/col misused?","do not use row to refer columns, or vice versa.","yellow");
					} else {
					// regular vars
						generalVars.push(varName);
						//highlightText(codeDiv,varName,"yellow");
					}
				}); // end of namesList
			}); // end of each dec
		});  // end of each decList
	}); 	// end of tr_code loop
	// show the result on summary UIPanel
	$(UIpanel).append("<h3 style='color:yellow'>Variables Declared</h3>");
	$(UIpanel).append("<p>[GENERAL VARS]"+makeLabels(_.unique(generalVars)).join(" ")+"</p>");
	$(UIpanel).append("<p>[LOOP VARS] "+makeLabels(_.unique(loopVars)).join(" ")+"</p>");
	$(UIpanel).append("<p>max-deduct :-2 <br> -1 per single-letter loop variable (x,y are okay) or row/col misuse. <br>-1 for other non-descriptive variables.</p>");
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 2. Symbilic constants for vertical/horizontal stretch
	///////////////////////////////////////////////////////////////////////////////////////////////////
	var literalsUsed = [];
	var tr_codes_stretched = rangeSelectCodeBlock(tr_codes,/public static Photograph stretched/,/public static Photograph/);
	$.each(tr_codes_stretched,function(tri,tr) {
		var codeText = $(tr).find("div.gwt-Label")[0].innerText;
		// actual test of the code string
		var regex_if_statement = /if(\s)*\([\s\S]+\)/;
		var regex_conditional_expr =/\([\s\S]+\)/;
		var regex_string_literal =/\"([a-zA-Z0-9]|\s)+\"/;
		var regex_int_literal =/==\s*[0-9]+/;
		if(codeText.match(regex_if_statement)) {
			var expr = codeText.match(regex_conditional_expr)[0];
			if(expr.match(/type/i) && expr.match(regex_int_literal)) {
				//console.log(codeText+", "+expr+", "+expr.match(regex_int_literal)[0]);
				literalsUsed.push(expr);
				btn_addComment(tr,"Use symbolic contants for 0 and 1","0 and 1 should be named constants, not literals.","orange");
				//$(tr).css("background-color","orange");
			}
		}
	});
	// show the result on summary UIPanel
	$(UIpanel).append("<h3 style='color:orange'>Conditionals containing literals</h3>");
	$(UIpanel).append("<p>[LITERALS IN CONDITIONAL FOUND] "+ makeLabels(literalsUsed).join(" ")   +"</p>");
	$(UIpanel).append("<p>don't deduct. only comment.</p>");
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 3. BLOCK COMMENTS ON HELPER METHODS
	//	add comment buttons for each helper method declaration. user clicks it -> count up -> calculate deducted points
	///////////////////////////////////////////////////////////////////////////////////////////////////
	var regex_functionDeclaration = /((public)|(private))\s+(static\s+)?((void)|(int)|(String)|(boolean)|(Photograph))\s+[a-zA-Z0-9]+\(/gi;
	$.each(tr_codes, function(tri,tr) {
		var codeDiv = $(tr).find("div.gwt-Label")[0];
		var codeText = $(codeDiv).text();
		if(!codeText) {  return; }
		// store code for each helper method block
		// actual test of the code string
		var statements = codeText.split(";");
		$.each(statements, function(ddi,st) { // per statements in one line
			var funcDec = st.match(regex_functionDeclaration);
			if (funcDec===null) return;
			$.each(funcDec, function(di,dec) {
				btn_addComment(tr,"Comment Block: does it have block comment?","Every Method you implement must have a comment block to tell its purpose","plum");
			});
		});
	});
	$(UIpanel).append("<h3 style='color:plum'>Comments</h3>");
	$(UIpanel).append("<p>(max deduct: -2) -2 for no comments at all. <br> -1 for missing a lot. </p>");
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 4. CODE REUSE
	//	it employs the helperMethods
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// highlights all the helper method names used throughout the code
	helperMethods = [/copy\(/,/makeGrayscale\(/,/pixelated\(/,/stretched\(/,/enlargement\(/,/rotated\(/,/upsideDown\(/,/stitchHelper\(/,/stitched\(/];
	//
	casesOfCodeReuse = [];
	$.each(tr_codes, function(tri,tr) {
		var codeDiv = $(tr).find("div.gwt-Label")[0];
		var codeText = $(codeDiv).text();
		if(!codeText) {  return; }
		if(codeText.match(regex_functionDeclaration)) return;	// do not apply on function declaration line
		_.each(helperMethods, function(hm,hmi) {
			if(codeText.match(hm) && !codeText.match(regex_functionDeclaration)) addCommentOnly(tr,hm,"green");
		});
	});
	var tr_codes_singleMethod;  var helperMethodsUsed;  var tr_methodDefinition;
	// check pixelated function uses copy method.
	tr_codes_singleMethod = rangeSelectCodeBlock(tr_codes,/public static Photograph pixelated/,/((public)|(private)) static/);
	helperMethodsUsed = getHelperMethodsUsedInCodeBlock(tr_codes_singleMethod,helperMethods);
	if (_.filter(helperMethodsUsed, function(reg) { return reg.source==(/copy\(/).source;}).length===0)  { //
		tr_methodDefinition = findTrUsingRegex(tr_codes, /public static Photograph pixelated/);
		btn_addComment(tr_methodDefinition,"Code Reuse: Pixelated without reusing copy method","Code Reuse: Pixelated function could have reused copy method of Photograph.","lightgreen");
	}
	casesOfCodeReuse.push({message:"Pixelated without reusing copy method", scrollTo:tr_methodDefinition});
	// check enlargement didn't call stretched twice
	tr_codes_singleMethod = rangeSelectCodeBlock(tr_codes,/public static Photograph enlargement/,/((public)|(private)) static/);
	helperMethodsUsed = getHelperMethodsUsedInCodeBlock(tr_codes_singleMethod,helperMethods);
	if (_.filter(helperMethodsUsed, function(reg) { return reg.source==(/stretched\(/).source;}).length===0)  { //
		tr_methodDefinition = findTrUsingRegex(tr_codes, /public static Photograph enlargement/);
		btn_addComment(tr_methodDefinition,"Code Reuse: Enlargement without reusing stretched method","Code Reuse: Enlargement function could have reused stretched method of Photograph.","lightgreen");
	}
	casesOfCodeReuse.push({message:"Enlargement without reusing stretched method", scrollTo:tr_methodDefinition});
	// upside-down didn't call rotated twice
	tr_codes_singleMethod = rangeSelectCodeBlock(tr_codes,/public static Photograph upsideDown/,/((public)|(private)) static/);
	helperMethodsUsed = getHelperMethodsUsedInCodeBlock(tr_codes_singleMethod,helperMethods);
	if (_.filter(helperMethodsUsed, function(reg) { return reg.source==(/rotated\(/).source;}).length===0)  { //
		tr_methodDefinition = findTrUsingRegex(tr_codes, /public static Photograph upsideDown/);
		btn_addComment(tr_methodDefinition,"Code Reuse: upsideDown without reusing rotated method","Code Reuse: upsideDown function could have reused rotated method of Photograph.","lightgreen");
	}
	casesOfCodeReuse.push({message:"Upsidedown without reusing rotated method", scrollTo:tr_methodDefinition});
	// also list all method not calling any helper method
	// show the result on summary UIPanel
	$(UIpanel).append("<h3 style='color:lightgreen'>Code Reuse</h3>");
	_.each(makeLabelsWithClick(casesOfCodeReuse), function(label) {
		$(UIpanel).append(label);
	});
	$(UIpanel).append("<p>(max deduct: -3) <br>-1 for not reusing copy method. <br> -1 for not reusing stretch in enlargement. <br> -1 for not reusing rotate in upside-down.</p>");
}
function cs131project2(UIpanel) {
	// second, find a list <tr>tags containing codes
	var sectionsStudentModified = ["src/studentCode/LetterMaker.java"];
	var tr_codes = _.reduce(sectionsStudentModified, function(memo,sec){
		var tr_list = $("div.GMYHEHOCNK:contains('"+sec+"')").parent().find("tr");
		return _.union(memo,tr_list);
	},[]);
	eventFire($("a:contains('"+sectionsStudentModified[0]+"')")[0],'click');
	tr_codes = tr_codes[0];	// flatten for 1-level to get <tr> for each codeline
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 1. good variable names
	///////////////////////////////////////////////////////////////////////////////////////////////////
	var loopVars = [];  generalVars = [];  whitelist = ['row','col','x','y'];
	var tokens_java_types = ["int","String","boolean","Scanner"];  // list of type tokens for finding variable names (should be added for later projects)
	//var regex_declaration = /^\s*(final)?\s*(static)?\s*((int)|(String)|(boolean)|(Scanner)) .*/g;
	var regex_declaration = /\s*((int)|(String)|(boolean)|(Scanner))\s[A-Za-z0-9]+\s*(=|;)/g;
	var regex_camelcase = /[a-z]([A-Z0-9][a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])*[A-Za-z0-9]*/g;
	$.each(tr_codes,function(tri,tr) {
		var codeDiv = $(tr).find("div.gwt-Label")[0];
		var codeText = $(codeDiv).text();
		if(!codeText) return;
		// actual test of the code string
		var statements = codeText.split(";");
		$.each(statements, function(ddi,st) { // per statements in one line
			var dl = st.match(regex_declaration);
			if(dl==null) return;
			// there could be multiple declarations in one line, so we use $.each
			$.each(dl, function(di,d) {
				var varNames = d.replace(/int/gi,"");
				var namesList = varNames.split(",");
				$.each(namesList, function(ni,name) {
					var varName = $.trim(name.replace(/=.*$/ig,""));
					if(varName.length<3 && whitelist.indexOf(varName)==-1)
							btn_addComment(tr,"Variable Name","Non-descriptive Variable Names : "+varName +" is not descriptive of its purpose","yellow");
					// loop vars
					if(!codeText.match(/((for)|(while))/i)) {
						loopVars.push(varName);
						//highlightText(codeDiv,varName,"yellow");
					} else {
					// regular vars
						generalVars.push(varName);
						//highlightText(codeDiv,varName,"yellow");
					}
				}); // end of namesList
			}); // end of each dec
		});  // end of each decList
	}); 	// end of tr_code loop
	// show the result on summary UIPanel
	$(UIpanel).append("<h3 style='color:yellow'>Variables Declared</h3>");
	$(UIpanel).append("<p>[GENERAL VARS]"+makeLabels(_.unique(generalVars)).join(" ")+"</p>");
	$(UIpanel).append("<p>[LOOP VARS] "+makeLabels(_.unique(loopVars)).join(" ")+"</p>");
	$(UIpanel).append("<p>max-deduct :-4 <br> -1 per single-letter loop variable (up to -2. x,y are okay). <br>-1 per other non-descriptive variables (up to 2)</p>");
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 2. BLOCK COMMENTS ON HELPER METHODS
	//	add comment buttons for each helper method declaration. user clicks it -> count up -> calculate deducted points
	///////////////////////////////////////////////////////////////////////////////////////////////////
	var helperMethods = {}, massingComments=[];
	var codeBlockPerHelperMethods = {};
	var givenMethods = ["getCenter","drawTopBar","drawT","errorGrid","drawLetter"];
	var regex_functionDeclaration = /((public)|(private))\s+(static\s+)?((void)|(int)|(String)|(boolean))\s+[a-zA-Z0-9]+\(/gi;
	var prev_tr, currentMethodName;
	$.each(tr_codes, function(tri,tr) {
		var codeDiv = $(tr).find("div.gwt-Label")[0];
		var codeText = $(codeDiv).text();
		if(!codeText) {  return; }
		// store code for each helper method block
		// actual test of the code string
		var statements = codeText.split(";");
		$.each(statements, function(ddi,st) { // per statements in one line
			var funcDec = st.match(regex_functionDeclaration);
			if (funcDec==null) return;
			$.each(funcDec, function(di,dec) {
				var functionName = dec.replace(/^.*\s([a-zA-Z0-9]+)\(/,"$1");
				if(givenMethods.indexOf(functionName)==-1) {
					helperMethods[functionName] = {div:codeDiv, codeline:$(codeDiv).parents("tr").find(".line-number").text()};
					currentMethodName = functionName;
					btn_addComment(tr,"Comment Block: does it have block comment?","Every Method you implement must have a comment block to tell its purpose","plum");
				}
			});
		});
		if(currentMethodName) { codeBlockPerHelperMethods[currentMethodName] = (codeBlockPerHelperMethods[currentMethodName])? codeBlockPerHelperMethods[currentMethodName]+" "+codeText : codeText; }
	});
	$(UIpanel).append("<h3 style='color:plum'>Block Comments</h3>");
	$(UIpanel).append("<p>-1 per helper methods without comment (up to -3) </p>");
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 3. CODE REUSE
	//	it employs the helperMethods
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// highlights all the helper method names used throughout the code
	$.each(tr_codes, function(tri,tr) {
		var codeDiv = $(tr).find("div.gwt-Label")[0];
		var codeText = $(codeDiv).text();
		if(!codeText) {  return; }
		if(codeText.match(regex_functionDeclaration)) return;	// do not apply on function declaration line
		_.each(_.keys(helperMethods), function(hm,hmi) {
			if(codeText.match(hm)) addCommentOnly(tr,hm,"green");
		});
	});
	// show the result on summary UIPanel
	$(UIpanel).append("<h3 style='color:lightgreen'>Helper methods</h3>");
	$(UIpanel).append("<p>"+makeLabels(_.keys(helperMethods)).join(" ")+"</p>");
	$(UIpanel).append("<p>(max deduct: -4) <br>-1~2: for not using helper methods that draw left/right vertical strokes.<br> -1: no helper used for diagonals in N and X.  <br>-1: no helper used for corner cells.</p>");
	$.each(codeBlockPerHelperMethods, function(cbi,cb) {
		console.log(cb);
		var numberOfHelperMethodsUsedWitinBlock = 0;
		_.each(helperMethods, function(mDiv,m) {
			if(cbi!=m && cb.indexOf(m)>-1) {
				numberOfHelperMethodsUsedWitinBlock++;
				console.log(m);
			}
		});
		if(numberOfHelperMethodsUsedWitinBlock==0) {
			$("<p>"+makeLabels([cbi])+" employs no helper method.</p>")
				.attr("codeline",helperMethods[cbi].codeline)
				.appendTo(UIpanel);
		}
	});
	$(UIpanel).append("<h3 style='color:orange'>Modularity</h3>");
	$(UIpanel).append("<p>-1: no method for drawing each letter used. Say 'Lack of modularity in code structure : each letter drawing operation deserves to be a separate method.' </p>");
	// add function to open textarea and automatically put the same text in
	
}
function cs131project1(UIpanel) {
	// second, find a list <tr>tags containing codes
	var sectionsStudentModified = ["src/CryptoQuiz.java","src/CryptoQuiz.java"];
	var tr_codes = _.reduce(sectionsStudentModified, function(memo,sec){
		var tr_list = $("div.GMYHEHOCNK:contains('"+sec+"')").parent().find("tr");
		return _.union(memo,tr_list);
	},[]);
	tr_codes = tr_codes[0];	// flatten for 1-level to get <tr> for each codeline
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 1. good variable names
	// 		we use blacklist such as [x, y, x1, temp2, junk, j, i, jj, kk, prt, lev]
	///////////////////////////////////////////////////////////////////////////////////////////////////
	var blacklist = ["x","y","temp","junk","i","j","jj","kk","prt","lev"];
	var nonfinalDeclarations = []; finalDeclarations= []; blacklistUsed = [], nonCamelCaseUsed= [], badSymbolicUsed= [];
	var tokens_java_types = ["int","String","boolean","Scanner"];  // list of type tokens for finding variable names (should be added for later projects)
	var regex_declaration = /^\s*(final)?\s*(static)?\s*((int)|(String)|(boolean)|(Scanner)) .*/g;
	var regex_camelcase = /[a-z]([A-Z0-9][a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])*[A-Za-z0-9]*/g;
	var regex_symbolic = /[A-Z]([A-Z0-9]*_)*[A-Z0-9]/g;
	$.each(tr_codes,function(tri,tr) {
		var codeDiv = $(tr).find("div.gwt-Label")[0];
		var codeText = $(codeDiv).text();
		if(!codeText) return;
		// actual test of the code string
		var decList = codeText.split(";");
		$.each(decList, function(ddi,dec) { // per statements in one line
			var dl = dec.match(regex_declaration);
			if(dl==null) return;
			// there could be multiple declarations in one line, so we use $.each
			$.each(dl, function(di,d) {
				var varNames = d.replace(/(final)|(int)|(String)|(boolen)|(Scanner)/gi,"");
				var namesList = varNames.split(",");
				$.each(namesList, function(ni,name) {
					var varName = $.trim(name.replace(/=.*$/ig,""));
					// check the variable is in the blacklist
					if(blacklist.indexOf(varName)>-1) {
						blacklistUsed.push(varName);
						highlightText(codeDiv,varName,"yellow");
					}
					// check camelCase of the non-symbolic variable name
					if(!codeText.match(/final/i)) {
						nonfinalDeclarations.push(varName);
						//if(varName.match(regex_camelcase)==null){
						//	nonCamelCaseUsed.push(varName);
						//}
					}
					// check symbolic constant format
					if(codeText.match(/final/i)) {
						finalDeclarations.push(varName);
						if (varName.match(regex_symbolic)==null) {
							badSymbolicUsed.push(varName);
							highlightText(codeDiv,varName,"yellow");
						}
					}
				}); // end of namesList
			}); // end of each dec
		});  // end of each decList
	}); // end of tr_codes
	// show the result on summary UIPanel
	$(UIpanel).append("<h3 style='color:yellow'>Variables Declared</h3>");
	$(UIpanel).append("<p>[NONFINAL VARS]"+makeLabels(_.unique(nonfinalDeclarations)).join(" ")+"</p>");
	$(UIpanel).append("<p>[FINAL VARS] "+makeLabels(_.unique(finalDeclarations)).join(" ")+"</p>");
	$(UIpanel).append("<p>[WEIRD FINALS] "+makeLabels(_.unique(badSymbolicUsed)).join(" ")+"</p>");
	$(UIpanel).append("<p>[BLACKLISTED] "+makeLabels(_.unique(blacklistUsed)).join(" ")+"</p>");
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 2. Proper use of symbilic constants
	///////////////////////////////////////////////////////////////////////////////////////////////////
	var literalsUsed = [], conditionalsUsed=[];
	$.each(tr_codes,function(tri,tr) {
		var codeText = $(tr).find("div.gwt-Label")[0].innerText;
		// actual test of the code string
		var regex_if_statement = /if(\s)*\([\s\S]+\)/;
		var regex_conditional_expr =/\([\s\S]+\)/;
		var regex_string_literal =/\"([a-zA-Z0-9]|\s)+\"/;
		var regex_int_literal =/==\s*[0-9]+/;
		if(codeText.match(regex_if_statement)) {
			var expr = codeText.match(regex_conditional_expr)[0];
			conditionalsUsed.push(expr);
			if(expr.match(regex_string_literal)) {
				console.log(codeText+", "+expr+", "+expr.match(regex_string_literal)[0]);
				literalsUsed.push(expr);
				highlightLine(tr,"Use symbolic contants in conditionals","orange");
			}
			if(expr.match(regex_int_literal)) {
				console.log(codeText+", "+expr+", "+expr.match(regex_int_literal)[0]);
				literalsUsed.push(expr);
				highlightLine(tr,"Use symbolic contants in conditionals","orange");
				//$(tr).css("background-color","orange");
			}
		}
	});
	// show the result on summary UIPanel
	$(UIpanel).append("<h3 style='color:orange'>Conditionals containing literals</h3>");
	$(UIpanel).append("<p>[ALL CONDITIONALS] "+ makeLabels(conditionalsUsed).join(" ")   +"</p>");
	$(UIpanel).append("<p>[LITERALS FOUND] "+ makeLabels(literalsUsed).join(" ")   +"</p>");
	///////////////////////////////////////////////////////////////////////////////////////////////////
	// RUBRIC 5. check line length > 80
	///////////////////////////////////////////////////////////////////////////////////////////////////
	var countOfTooLongLines = 0;
	$.each(tr_codes,function(tri,tr) {
		var code = $(tr).find("div.gwt-Label").clone();
		var tip = code.children();   tip.remove();
		var codeText = code.text();
		codeText = codeText.replace(/\t/ig,"    ");
		if(codeText.length>80) {
			// count and modify too long lines of code
			countOfTooLongLines =countOfTooLongLines+1;
			//tooltip(tr,"Line Length > 80");
			highlightLine(tr,"Line length should be shorter than 80 characters.","lightgreen");
		}
	});
	// show the result on summary UIPanel
	$(UIpanel).append("<h3 style='color:lightgreen'>Line length longer than 80</h3>");
	$(UIpanel).append("<p> total "+countOfTooLongLines+" lines found</p>");
	// add function to open textarea and automatically put the same text in
	$(".tip").click(function() {
		eventFire($(this).parent()[0],'dblclick');
		var self =this;
		setTimeout(function() {
			$(self).parent().parent().find("input[type='checkbox']").prop("checked",false);
			$(self).parent().parent().find("textarea").val($(self).text());
			$(self).parent().parent().find("textarea").focus().select();
			$(self).parent().parent().find("textarea").focus().select();
			eventFire($(self).parent().parent().find("a:contains('Save')")[0],'click');
		},500);
	});
} // end of project 1
$(document).ready(function() {
	setTimeout(main,3000);
})
//addButton("RUN SEARCH",search,UIpanel);
//addButton("RUN SEARCH",search,UIpanel);
//addButton("RUN SEARCH",search,UIpanel);
function getHelperMethodsUsedInCodeBlock(tr_codes,helperMethods) {
	var usedMethods = [];
	for (i in tr_codes) {
		var tr = tr_codes[i];
		var codeText = $(tr).find("div.gwt-Label")[0].innerText;
		_.each(helperMethods, function(m,mi) {
			if(codeText.match(m)) usedMethods.push(m);
		});
	}
	return usedMethods;
}
function rangeSelectCodeBlock(tr_codes,start,end) {
	//return a range of tr_codes starting from line matching start regex and before matching end regex
	var result_tr=[]; var flag=false;
	console.error(start);
	console.error(end);
	for (i in tr_codes) {
		var tr = tr_codes[i];
		var codeText = $(tr).find("div.gwt-Label")[0].innerText;
		if(flag && codeText.match(end)) { 
			flag=false; return result_tr; 
		}
		if(codeText.match(start)) 
			flag=true;
		if(flag) {
			result_tr.push(tr);
			console.log(codeText);
		}
		
	}
	return result_tr;
}
function findTrUsingRegex(tr_codes,reg) {
	for (i in tr_codes) {
		var tr = tr_codes[i];
		var codeText = $(tr).find("div.gwt-Label")[0].innerText;
		if(codeText.match(reg)) return tr;
	}
	return null;
}
function uncheckBoxes(){
	$("label:contains('Request reply?')").parent().find("input").prop('checked',false);
}
function eventFire(el, etype){
  if (el.fireEvent) {
    (el.fireEvent('on' + etype));
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}
function addCommentOnly(tr,title,color) {
	var code = $(tr).find(".gwt-Label");
	$(code).append($("<span class='comment' style='border:1px solid "+color+"; color:"+color+"'>&larr;"+title+"</span>"));
}
function btn_addComment(tr,title,msg,color) {
	var codeNumber = $(tr).find("td.line-number");
	$(codeNumber).css("border-left","3px solid "+color);
	var code = $(tr).find(".gwt-Label");
	//$(code).html($(code).html().replace(/$/ig,"<span class='tip' style='background-color:"+color+"'>"+title+"</span>"));
	$(code).append($("<span class='tip' style='background-color:"+color+"' msg='"+msg+"'>"+title+"</span>"));
}
function highlightLine(tr,msg,color) {
	var codeNumber = $(tr).find("td.line-number");
	$(codeNumber).css("border-left","3px solid "+color);
	var code = $(tr).find(".gwt-Label");
	$(code).html($(code).html().replace(/$/ig,"<span class='tip' style='background-color:"+color+"'>"+msg+"</span>"));
}
function highlightText(leafDom,s,color) {
	$(leafDom).textWalk(function() {
		this.data = this.data.replace(" "+s," <span style='background-color:"+color+"'>"+s+"</span>");
	});
	//$(leafDom).html($(leafDom)[0].innerHTML.replace(" "+s," <span style='background-color:"+color+"'>"+s+"</span>"));
}
function makeLabels(strList) {
	return _.map(strList, function(s) { return "<span class='label'>"+ s +"</span>"; });
}
function makeLabelsWithClick(list) {
	return _.map(list, function(d) {
		var label = $("<span class='label'>"+d.message+"</span>").click(function() {
			paneToScroll.scrollTop($(d.scrollTo).position().top);
		});
		return label[0];
	});
}
function addButton(innertext,clickListener,parent) {
	var button_search = document.createElement("button");
	button_search.innerText = innertext;
	button_search.onclick = clickListener;
	parent.appendChild(button_search);
}
function contains(elementList,regex) {
	var filteredElements =  Array.prototype.slice.call(elementList).filter(function(e) {  return regex.test(e.innerText); });
	return Array.prototype.slice.call(filteredElements);
}
function selectWithRegex(elementList, startRegex, endRegex) {
	var result = [];
	var started = false; var end= false;
	for(var i in elementList) {
		var e = elementList[i];
		if(startRegex.test(e.innerText))  started = true;
		if(started) result.push(e);
		if(started && endRegex.test(e.innerText)) end = true;
		if(end) break;
	}
	return result;
}
function getInnerText(elementList,separator) {
	return elementList.map(function(e) { return e.innerText; }).join();
}
function search() {
	var Model = contains(document.querySelectorAll("div.GMYHEHOCNK"),/Model/)[0].parentNode;
	var codeLines = Model.querySelectorAll("div.gwt-Label");
	var variablesUsed = {};
	var booleanUsed = [];
	var directionIntegerUsed = [];
	var methodsWithoutCommentBlock = [];
	for(i in codeLines) {
		var text = codeLines[i].textContent;
		if(text==null || text==undefined) continue;
		text = text.replace(/\t/,"");
		if(text.match(/int\s+\w+\s+/)) {
			var matches = text.match(/int\s+\w+\s+/gi);
			for(i in matches) {
				var varName = matches[i].replace(/\int\s+/,"").replace(/\s+/,"");
				console.log(varName + " at " + text);
				if(variablesUsed[varName]==undefined) variablesUsed[varName]=0;
				variablesUsed[varName]=variablesUsed[varName]+1;
			}
		}
		// check named constants
		if(text.match(/(true|false)/)  && !text.match(/static/) && !text.match(/\/\//) && !text.match(/\*/))  booleanUsed.push(text.replace(/\s*/,""));
		if(text.match(/(10|11|12|13)/)  && !text.match(/static/)   && !text.match(/Random/))  directionIntegerUsed.push(text);
		// check block comments before method definitions
		if(text.match(/^(public|private)\s(void|boolean|int|Fish|Plant)/)) {
			//check the previous lines whether it contains any comment block symbols
			if(codeLines[i-1]!=undefined) {
				var prevLine = codeLines[i-1].textContent;
				if(!prevLine.match(/(\*\/|\/\/)/)) {
					methodsWithoutCommentBlock.push(text);
				}
			}
		}
	}
	console.log(JSON.stringify(variablesUsed));
	console.log("boolean used");
	console.log(JSON.stringify(booleanUsed));
	console.log("direction integers used");
	console.log(JSON.stringify(directionIntegerUsed));
	console.log("methods without comment block");
	console.log(JSON.stringify(methodsWithoutCommentBlock));
		/*
		if (/instanceof/.test(text)) {
			console.log("instanceof")
			console.log(codeLines[i]);
		}
		if (/ArrayList/.test(text)) {
			console.log("ArrayList")
			console.log(codeLines[i]);
		}
		if (/Arrays\.sort/.test(text)) {
			console.log("Arrays.sort")
			console.log(codeLines[i]);
		}
	}*/
	//var PetStore = contains(targetDIV.querySelectorAll("div.GMYHEHOCNK"),/PetStore/)[0].parentNode;
	//console.log(getInnerText(contains(PetStore.querySelectorAll("div.gwt-Label"),/for/)));
	//console.log("check add(SortedListOfImmutables listToAdd)");
	//var codeLinesOfSortedList = SortedList.querySelectorAll("div.gwt-Label");
	//var lines = selectWithRegex(codeLinesOfSortedList,/add\(SortedListOfImmutables listToAdd\)/,/\*\*/);
	//console.log(getInnerText(contains(lines,/add/)));
	//console.log(getInnerText(lines));
}
jQuery.fn.textWalk = function( fn ) {
    this.contents().each( jwalk );
    function jwalk() {
        var nn = this.nodeName.toLowerCase();
        if( nn === '#text' ) {
            fn.call( this );
        } else if( this.nodeType === 1 && this.childNodes && this.childNodes[0] && nn !== 'script' && nn !== 'textarea' ) {
            $(this).contents().each( jwalk );
        }
    }
    return this;
};
jQuery.fn.nextCodeLine = function() {
	return $(this).parents("tr").next().find(".gwt-Label");
}
function scrollTo(container,element) {
	var offset = getOffset(element);
	container.scrollTop = offset.top;
}
function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.parentNode;
    }
    return { top: _y, left: _x };
}
//var list = $("a:contains('sandwich')");
//console.log(list);
//for(i in list) {
//	console.log($(list[i]));
//}
//$.each(list, function(el) {  console.log($(el).text());});