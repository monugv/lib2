const TEN_SECONDS = 10 * 1000;
class LoginService {
  fillEmailFieldValue(account) {
    browser.waitUntil(() =>
      browser.execute(
        () =>
          document.querySelectorAll("[data-id='EmailPage-EmailField']").length >
          0
      )
    );

    browser.waitUntil(() =>
      browser.execute(() => !!!window.transitionInProgress)
    );

    const userName = $("[data-id='EmailPage-EmailField']");
    userName.setValue(account.username);

    $("[data-id='EmailPage-ContinueButton']").click();
  }
  fillAccountCredentials(
    account,
    waitForEmailField = true,
    waitForUserName = true
  ) {
    if (waitForEmailField) {
      this.fillEmailFieldValue(account);
    }

    switch (account.account_type) {
      case "type1":
      case "type2": {
        const passwordField = $("[data-id='PasswordPage-PasswordField']");

        passwordField.waitForExist();
        browser.waitUntil(() =>
          browser.execute(() => !!!window.transitionInProgress)
        );
        passwordField.setValue(account.password);

        $("[data-id='PasswordPage-ContinueButton']").click();

        const submitBtn = $("[name='Submit']");
        if (submitBtn.isExisting()) {
          submitBtn.click();
        }
        break;
      }
      case "type3": {
        const userName = $("#okta-signin-username");
        try{
          userName.waitForExist(TEN_SECONDS); //default is 500 ms
        }catch (err) {} //don't fail test

        if (userName.isExisting()) {
          userName.setValue(account.username);

          $("#okta-signin-password").setValue(account.password);
          $("#okta-signin-submit").click();
        }

        break;
      }
    }
  }

  choosePersonalProfile(account) {
    this.fillEmailFieldValue(account);

    browser.waitUntil(() =>
      browser.execute(() => !!!window.transitionInProgress)
    );

    this.fillAccountCredentials(account, false, true);
    browser.waitUntil(() =>
      browser.execute(
        () =>
          document.querySelectorAll("[data-id='PP-ProfileChooser-AuthAccount']")
            .length > 0
      )
    );

    browser.waitUntil(() =>
      browser.execute(() => !!!window.transitionInProgress)
    );
    
    const personalProfileDiv = $("[data-id='PP-ProfileChooser-AuthAccount']");
    personalProfileDiv.click();
  }
  fillReauthCredentials(account) {
    if (account.account_type === "type3") {
      return;
    }
    browser.waitUntil(() =>
      browser.execute(() => !!!window.transitionInProgress)
    );
    browser.waitUntil(() =>
      browser.execute(
        () =>
          document.querySelectorAll("[data-id='PasswordPage-PasswordField']")
            .length > 0
      )
    );

    const password = $("[data-id='PasswordPage-PasswordField']");

    password.setValue(account.password);
    $("[data-id='PasswordPage-ContinueButton']").click();
  }
}

module.exports = new LoginService();
